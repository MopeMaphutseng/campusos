import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TutorSession, TutorMode, IntegrityMode } from './entities/tutor-session.entity';
import { AIService } from './services/ai.service';
import {
  AIProvider,
  CitationFormat,
  Flashcard,
  IntegrityMode as AIIntegrityMode,
} from './services/ai-provider.interface';

export interface CampusGPTMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
  sources?: Array<{ title: string; url?: string; relevance: number }>;
}

export interface TutorReply {
  reply: string;
  sources: Array<{ title: string; url?: string; relevance: number }>;
  tokensUsed: number;
  provider: AIProvider;
  integrityNotice?: string;
}

export interface FlashcardSet {
  id: string;
  courseId?: string;
  courseCode?: string;
  flashcards: Flashcard[];
  tokensUsed: number;
  generatedAt: Date;
}

export interface PaperSummary {
  summary: string;
  keyTopics: string[];
  sections: Array<{ title: string; summary: string }>;
  tokensUsed: number;
}

export interface ChapterExplanation {
  chapter: string;
  explanation: string;
  keyConcepts: string[];
  practiceQuestions: string[];
  tokensUsed: number;
}

export interface CitationResult {
  citation: string;
  format: CitationFormat;
}

@Injectable()
export class AiTutorService {
  private readonly logger = new Logger(AiTutorService.name);

  constructor(
    @InjectRepository(TutorSession) private sessionRepo: Repository<TutorSession>,
    private aiService: AIService,
  ) {}

  private mapIntegrityMode(mode: IntegrityMode): AIIntegrityMode {
    switch (mode) {
      case IntegrityMode.STRICT: return AIIntegrityMode.EXAM_MODE;
      case IntegrityMode.NORMAL: return AIIntegrityMode.FULL_ASSIST;
      case IntegrityMode.OPEN: return AIIntegrityMode.EXPLAIN_ONLY;
      default: return AIIntegrityMode.FULL_ASSIST;
    }
  }

  private async getCourseMaterials(universityId: string, courseId?: string, courseCode?: string): Promise<string[]> {
    const materials: string[] = [];

    try {
      const { LibraryItem } = await import('../library/entities/library-item.entity');
      const itemRepo = this.sessionRepo.manager.getRepository(LibraryItem);

      const where: Record<string, any> = { universityId };
      if (courseId) where.courseId = courseId;
      if (courseCode) where.courseCode = courseCode;

      const items = await itemRepo.find({ where, take: 10, order: { viewCount: 'DESC' } });
      for (const item of items) {
        if (item.content) materials.push(`${item.title}: ${item.content.slice(0, 2000)}`);
        else if (item.description) materials.push(`${item.title}: ${item.description}`);
      }
    } catch {
      this.logger.debug('Library module not available for course grounding');
    }

    return materials;
  }

  private async getStudentPerformanceContext(
    universityId: string,
    userId: string,
    courseId?: string,
    courseCode?: string,
  ): Promise<string> {
    try {
      const { Enrollment, EnrollmentStatus } = await import('../academics/entities/enrollment.entity');
      const repo = this.sessionRepo.manager.getRepository(Enrollment);

      const enrollments = await repo.find({
        where: { universityId, userId },
        relations: ['course'],
        order: { enrolledAt: 'DESC' },
        take: 30,
      });

      const active = enrollments.filter((e) => e.status !== EnrollmentStatus.DROPPED);

      if (!active.length) {
        return '## Student performance (authoritative - live from CampusOS)\nThe student has no active course enrollments recorded in CampusOS yet.';
      }

      const gradeOf = (e: any): number | null => {
        if (e.grade === null || e.grade === undefined || e.grade === '') return null;
        const n = Number(e.grade);
        return Number.isFinite(n) ? n : null;
      };

      const graded = active.filter((e) => gradeOf(e) !== null);
      const avg =
        graded.length > 0
          ? graded.reduce((sum, e) => sum + (gradeOf(e) as number), 0) / graded.length
          : null;

      const lines: string[] = active.map((e) => {
        const course = e.course as { code?: string; name?: string; credits?: number; department?: string } | null;
        const label =
          [course?.code, course?.name].filter(Boolean).join(' ') || courseCode || 'Unknown course';
        const extras = [course?.credits != null ? `${course.credits} credits` : null, course?.department]
          .filter(Boolean)
          .join(', ');
        const g = gradeOf(e);
        const letter = e.letterGrade ? ` (${e.letterGrade})` : '';
        const gradePart = g !== null ? `${g.toFixed(1)}%${letter}` : 'no grade recorded yet';
        const isCurrent =
          (!!courseId && e.courseId === courseId) || (!!courseCode && course?.code === courseCode);
        return `- ${label}${extras ? ` [${extras}]` : ''}: ${gradePart} [${e.status}]${isCurrent ? ' <- current tutor course' : ''}`;
      });

      // Weekly timetable for the student's enrolled courses (live from CampusOS)
      let timetableBlock = '';
      try {
        const { TimetableEntry } = await import('../academics/entities/timetable.entity');
        const courseIds = active.map((e) => e.courseId);
        const entries = courseIds.length
          ? await this.sessionRepo.manager.getRepository(TimetableEntry).find({
              where: { universityId, courseId: In(courseIds) } as any,
            })
          : [];
        if (entries.length) {
          const dayOrder: Record<string, number> = {
            monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
          };
          entries.sort((a, b) => {
            const d = (dayOrder[a.dayOfWeek] ?? 9) - (dayOrder[b.dayOfWeek] ?? 9);
            return d !== 0 ? d : String(a.startTime).localeCompare(String(b.startTime));
          });
          const ttLines = entries.map((t: any) => {
            const where = [t.venue, t.building].filter(Boolean).join(', ');
            const who = t.instructorName ? `, lecturer ${t.instructorName}` : '';
            return `- ${t.dayOfWeek} ${t.startTime}-${t.endTime}: ${t.courseCode} ${t.courseName} @ ${where || 'venue TBA'}${who}`;
          });
          timetableBlock = ['\n\n### Weekly timetable (authoritative - live from CampusOS)', ...ttLines].join('\n');
        } else {
          timetableBlock = '\n\n### Weekly timetable (authoritative - live from CampusOS)\nNo timetable entries are recorded yet for the student\'s enrolled courses.';
        }
      } catch (error) {
        this.logger.debug(`Timetable context unavailable: ${(error as Error)?.message}`);
      }

      const header =
        avg !== null
          ? `## Student academic record (authoritative - live from CampusOS)\nOverall: average ${avg.toFixed(1)}% across ${graded.length} of ${active.length} active course(s) with recorded grades.`
          : `## Student academic record (authoritative - live from CampusOS)\nThe student has ${active.length} active course enrollment(s), but no final grades are recorded yet in CampusOS.`;

      const guidance =
        '\n\nUse this to guide the student: ground all advice about their progress, schedule, course load, or how to improve in these actual records.' +
        ' Name stronger subjects, prioritise weaker ones, and give concrete, course-specific improvement steps.' +
        ' For courses with no grade recorded, say that plainly instead of guessing. Never invent grades, courses, timetable slots, venues, or lecturers beyond what is listed here; if asked about data not shown here, state that it is not recorded in CampusOS yet.';

      return [header, ...lines, timetableBlock, guidance].join('\n');
    } catch (error) {
      this.logger.debug(`Student performance context unavailable: ${(error as Error)?.message}`);
      return '';
    }
  }

  private campusContextCache = new Map<string, { at: number; text: string }>();
  private static weatherCache: { at: number; text: string } | null = null;

  private fmtWhen(d: Date | string | null | undefined): string {
    if (!d) return 'TBA';
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return 'TBA';
    return dt.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  private async fetchWeather(): Promise<string> {
    const now = Date.now();
    if (AiTutorService.weatherCache && now - AiTutorService.weatherCache.at < 30 * 60 * 1000) {
      return AiTutorService.weatherCache.text;
    }
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=-29.3156&longitude=27.4869&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Africa%2FMaseru&forecast_days=2';
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`weather HTTP ${res.status}`);
    const data: any = await res.json();
    const codeOf = (c: any): string => {
      const w = Number(c);
      if (w === 0) return 'clear sky';
      if (w <= 2) return 'partly cloudy';
      if (w === 3) return 'overcast';
      if (w <= 48) return 'fog';
      if (w <= 57) return 'drizzle';
      if (w <= 67) return 'rain';
      if (w <= 77) return 'snow';
      if (w <= 82) return 'rain showers';
      return 'stormy';
    };
    const cur = data?.current ?? {};
    const daily = data?.daily ?? {};
    const lines = [
      `- Now: ${Math.round(Number(cur.temperature_2m))}°C, ${codeOf(cur.weather_code)}, wind ${Math.round(Number(cur.wind_speed_10m))} km/h (Maseru)`,
    ];
    if (daily.time?.[0]) {
      lines.push(`- Today: ${Math.round(Number(daily.temperature_2m_min?.[0]))}°C to ${Math.round(Number(daily.temperature_2m_max?.[0]))}°C, ${codeOf(daily.weather_code?.[0])}`);
    }
    if (daily.time?.[1]) {
      lines.push(`- Tomorrow: ${Math.round(Number(daily.temperature_2m_min?.[1]))}°C to ${Math.round(Number(daily.temperature_2m_max?.[1]))}°C, ${codeOf(daily.weather_code?.[1])}`);
    }
    const text = lines.join('\n');
    AiTutorService.weatherCache = { at: now, text };
    return text;
  }

  private async getCampusContext(universityId: string, userId: string): Promise<string> {
    const key = `${universityId}:${userId}`;
    const cached = this.campusContextCache.get(key);
    if (cached && Date.now() - cached.at < 3 * 60 * 1000) return cached.text;

    const sections: string[] = [];
    const mgr = this.sessionRepo.manager;
    const q = async (label: string, fn: () => Promise<string[] | null>) => {
      try {
        const lines = await fn();
        if (lines?.length) sections.push(`### ${label}\n${lines.join('\n')}`);
      } catch (error) {
        this.logger.debug(`Campus context section "${label}" unavailable: ${(error as Error)?.message}`);
      }
    };

    // Weather (live, best-effort)
    await q('Weather (Maseru, live forecast)', async () => {
      const w = await this.fetchWeather();
      return w ? w.split('\n') : null;
    });

    // Notifications (this student, unread)
    await q('Notifications (unread, for this student)', async () => {
      const { Notification } = await import('../notifications/entities/notification.entity');
      const rows = await mgr.getRepository(Notification).find({
        where: { universityId, userId, read: false } as any,
        order: { createdAt: 'DESC' },
        take: 5,
      });
      return rows.map((n: any) => `- ${n.title}: ${String(n.body ?? '').slice(0, 140)} [${n.priority ?? 'normal'}]`);
    });

    // Messages (this student's conversations)
    await q('Messages (this student conversations)', async () => {
      const { Conversation } = await import('../messaging/entities/conversation.entity');
      const rows = await mgr.getRepository(Conversation).find({
        where: { universityId, isActive: true } as any,
        order: { lastMessageAt: 'DESC' },
        take: 40,
      });
      const mine = rows.filter((c: any) => Array.isArray(c.participantIds) && c.participantIds.includes(userId)).slice(0, 4);
      return mine.map((c: any) => {
        const who = c.name || (Array.isArray(c.participantIds) ? `${c.participantIds.length} participants` : 'conversation');
        return `- ${who}: "${String(c.lastMessagePreview ?? 'no preview').slice(0, 100)}" (${this.fmtWhen(c.lastMessageAt)})`;
      });
    });

    // News
    await q('Campus news (published)', async () => {
      const { NewsArticle } = await import('../news/entities/news-article.entity');
      const rows = await mgr.getRepository(NewsArticle).find({
        where: { universityId, isPublished: true } as any,
        order: { publishedAt: 'DESC' },
        take: 5,
      });
      return rows.map((n: any) => `- ${n.title} [${n.category}] (${this.fmtWhen(n.publishedAt)})`);
    });

    // Events / seminars
    await q('Upcoming events, seminars & workshops', async () => {
      const { Seminar } = await import('../seminars/entities/seminar.entity');
      const rows = await mgr.getRepository(Seminar).find({
        where: { universityId, status: 'open' } as any,
        take: 20,
      });
      const now = Date.now();
      return rows
        .filter((s: any) => !s.startDate || new Date(s.startDate).getTime() >= now - 86400000)
        .sort((a: any, b: any) => new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime())
        .slice(0, 4)
        .map((s: any) => `- ${s.title} [${s.type}] @ ${s.location ?? 'TBA'} — ${this.fmtWhen(s.startDate)}`);
    });

    // Sports fixtures
    await q('Sports fixtures', async () => {
      const { SportsMatch } = await import('../sports/entities/match.entity');
      const rows = await mgr.getRepository(SportsMatch).find({ where: { universityId } as any, take: 20 });
      const now = Date.now();
      return rows
        .filter((m: any) => m.status === 'scheduled' && (!m.scheduledAt || new Date(m.scheduledAt).getTime() >= now))
        .sort((a: any, b: any) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime())
        .slice(0, 3)
        .map((m: any) => `- ${m.sport}: ${m.homeTeam} vs ${m.awayTeam} @ ${m.venue ?? 'TBA'} — ${this.fmtWhen(m.scheduledAt)}`);
    });

    // Library materials + past exam papers
    await q('Library materials & past exam papers', async () => {
      const { LibraryItem } = await import('../library/entities/library-item.entity');
      const rows = await mgr.getRepository(LibraryItem).find({
        where: { universityId } as any,
        order: { createdAt: 'DESC' },
        take: 40,
      });
      const papers = rows.filter((i: any) => /past exam/i.test(String(i.title ?? ''))).slice(0, 6);
      const recent = rows.filter((i: any) => !papers.includes(i)).slice(0, 5);
      const lines: string[] = [];
      if (papers.length) {
        lines.push(`- Past exam papers available: ${papers.map((p: any) => `${p.title}${p.courseCode ? ` (${p.courseCode})` : ''}`).join('; ')}`);
      }
      for (const r of recent) {
        lines.push(`- ${r.title} [${r.type}${r.courseCode ? `, ${r.courseCode}` : ''}]`);
      }
      return lines;
    });

    // Mentors
    await q('Available mentors', async () => {
      const { MentorProfile } = await import('../mentorship/entities/mentor-profile.entity');
      const { User } = await import('../tenants/entities/user.entity');
      const rows = await mgr.getRepository(MentorProfile).find({
        where: { universityId, status: 'available' } as any,
        take: 8,
      });
      if (!rows.length) return [];
      const userIds = [...new Set(rows.map((m: any) => m.userId))];
      const users = await mgr.getRepository(User).find({ where: { id: In(userIds) } as any });
      const nameOf = new Map(users.map((u: any) => [u.id, `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Mentor']));
      return rows.slice(0, 5).map((m: any) => {
        const exp = Array.isArray(m.expertise) ? m.expertise.join(', ') : '';
        return `- ${nameOf.get(m.userId) ?? 'Mentor'} — ${exp || 'general'} (★${Number(m.averageRating ?? 0).toFixed(2)}, ${m.reviewCount ?? 0} reviews)`;
      });
    });

    // Campus map
    await q('Campus map locations', async () => {
      const { CampusMapLocation } = await import('../campus-life/entities/campus-map.entity');
      const rows = await mgr.getRepository(CampusMapLocation).find({
        where: { universityId, isActive: true } as any,
        order: { name: 'ASC' },
        take: 40,
      });
      return rows.slice(0, 8).map((l: any) => `- ${l.name} [${l.type}]${l.building ? ` — ${l.building}${l.floor ? `, floor ${l.floor}` : ''}` : ''}`);
    });

    // Health (this student's upcoming appointments)
    await q('Health appointments (this student, upcoming)', async () => {
      const { HealthAppointment } = await import('../health/entities/health-appointment.entity');
      const rows = await mgr.getRepository(HealthAppointment).find({
        where: { universityId, userId } as any,
        take: 20,
      });
      const now = Date.now();
      return rows
        .filter((h: any) => ['pending', 'confirmed', 'in_progress'].includes(String(h.status)) && new Date(h.scheduledAt).getTime() >= now)
        .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 4)
        .map((h: any) => `- ${h.type} @ ${h.location ?? 'Campus Clinic'} with ${h.providerName ?? 'clinic staff'} — ${this.fmtWhen(h.scheduledAt)} [${h.status}]`);
    });

    // Jobs
    await q('Open jobs & internships', async () => {
      const { JobListing } = await import('../jobs/entities/job-listing.entity');
      const rows = await mgr.getRepository(JobListing).find({
        where: { universityId, status: 'active' } as any,
        take: 20,
      });
      return rows
        .sort((a: any, b: any) => new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime())
        .slice(0, 6)
        .map((j: any) => `- ${j.title} @ ${j.company} [${j.type}, ${j.isRemote ? 'remote' : j.location ?? 'onsite'}] closes ${this.fmtWhen(j.deadline)}`);
    });

    // Research calls
    await q('Open research calls', async () => {
      const { ResearchCall } = await import('../research-hub/entities/research-call.entity');
      const rows = await mgr.getRepository(ResearchCall).find({
        where: { universityId, status: 'open' } as any,
        take: 10,
      });
      return rows.slice(0, 4).map((r: any) => {
        const skills = Array.isArray(r.requiredSkills) && r.requiredSkills.length ? ` — needs ${r.requiredSkills.join(', ')}` : '';
        return `- ${r.title} [${r.type}, ${r.field ?? r.department ?? 'interdisciplinary'}]${skills}; closes ${this.fmtWhen(r.deadline)}`;
      });
    });

    // Scholarships
    await q('Open scholarships', async () => {
      const { Scholarship } = await import('../scholarships/entities/scholarship.entity');
      const rows = await mgr.getRepository(Scholarship).find({
        where: { universityId, status: 'open' } as any,
        take: 20,
      });
      return rows
        .sort((a: any, b: any) => new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime())
        .slice(0, 5)
        .map((s: any) => `- ${s.title}: ${s.amount} ${s.currency ?? 'USD'} by ${s.providerName ?? 'donor'} [${s.type}] — apply by ${this.fmtWhen(s.deadline)} (${s.availableSlots ?? '?'} slots)`);
    });

    // Marketplace
    await q('Marketplace (active listings)', async () => {
      const { Listing } = await import('../marketplace/entities/listing.entity');
      const rows = await mgr.getRepository(Listing).find({
        where: { universityId, status: 'active' } as any,
        order: { createdAt: 'DESC' },
        take: 6,
      });
      return rows.map((l: any) => `- ${l.title}: ${l.price} ${l.currency ?? 'USD'} [${l.category}]`);
    });

    if (!sections.length) return '';
    const text =
      '## Campus snapshot (authoritative - live from CampusOS modules)\n' +
      sections.join('\n\n') +
      "\n\nThese blocks are live records from CampusOS. Answer the student's questions using them. If a section is absent, that data is simply not in CampusOS yet — say so instead of inventing items, prices, dates, or names.";
    this.campusContextCache.set(key, { at: Date.now(), text });
    return text;
  }

  async createSession(universityId: string, userId: string, data: {
    courseId?: string;
    courseCode?: string;
    mode?: TutorMode;
    integrityMode?: IntegrityMode;
  }): Promise<TutorSession> {
    if (data.mode && !Object.values(TutorMode).includes(data.mode)) {
      throw new BadRequestException(`Invalid tutor mode: ${data.mode}`);
    }
    if (data.integrityMode && !Object.values(IntegrityMode).includes(data.integrityMode)) {
      throw new BadRequestException(`Invalid integrity mode: ${data.integrityMode}`);
    }
    const session = this.sessionRepo.create({
      universityId,
      userId,
      courseId: data.courseId,
      courseCode: data.courseCode,
      mode: data.mode || TutorMode.STUDY,
      integrityMode: data.integrityMode || IntegrityMode.NORMAL,
      messages: [],
      sources: [],
      isActive: true,
    });
    return this.sessionRepo.save(session);
  }

  async sendMessage(
    universityId: string,
    sessionId: string,
    userId: string,
    content: string,
  ): Promise<TutorReply> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, universityId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new BadRequestException('Unauthorized');

    const [contextMaterials, performanceContext, campusContext] = await Promise.all([
      this.getCourseMaterials(universityId, session.courseId, session.courseCode),
      this.getStudentPerformanceContext(universityId, userId, session.courseId, session.courseCode),
      this.getCampusContext(universityId, userId),
    ]);

    const systemPrompt = this.buildSystemPrompt(
      session.mode,
      session.courseCode,
      contextMaterials,
      [performanceContext, campusContext].filter(Boolean).join('\n\n'),
    );

    const aiMessages = session.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    aiMessages.push({ role: 'user', content });

    const result = await this.aiService.generateWithSystemPrompt({
      systemPrompt,
      messages: aiMessages,
      universityId,
      userId,
      courseId: session.courseId,
      temperature: 0.7,
      maxTokens: 2048,
    });

    const sources = this.extractSources(result.text, contextMaterials);
    const integrityNotice = this.getIntegrityNotice(session.integrityMode);

    const userMsg: CampusGPTMessage = {
      role: 'user',
      content: content ?? '',
      timestamp: new Date(),
      tokens: Math.max(1, (content ?? '').trim().split(/\s+/).length),
    };
    session.messages.push(userMsg);

    const assistantMsg: CampusGPTMessage = {
      role: 'assistant',
      content: result.text,
      timestamp: new Date(),
      tokens: result.tokensUsed,
      sources,
    };
    session.messages.push(assistantMsg);

    session.totalTokens += result.tokensUsed;
    session.messageCount += 2;
    session.sources = [...session.sources, ...sources].slice(0, 50);

    await this.sessionRepo.save(session);

    return {
      reply: result.text,
      sources,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      integrityNotice,
    };
  }

  async streamMessage(
    universityId: string,
    sessionId: string,
    userId: string,
    content: string,
  ): Promise<AsyncGenerator<{ text: string; done: boolean; tokensUsed?: number }>> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, universityId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new BadRequestException('Unauthorized');

    const [contextMaterials, performanceContext, campusContext] = await Promise.all([
      this.getCourseMaterials(universityId, session.courseId, session.courseCode),
      this.getStudentPerformanceContext(universityId, userId, session.courseId, session.courseCode),
      this.getCampusContext(universityId, userId),
    ]);
    const systemPrompt = this.buildSystemPrompt(
      session.mode,
      session.courseCode,
      contextMaterials,
      [performanceContext, campusContext].filter(Boolean).join('\n\n'),
    );

    const self = this;
    return (async function* () {
      let fullReply = '';
      let lastTokens = 0;

      for await (const chunk of self.aiService.streamResponse({
        prompt: content,
        universityId,
        userId,
        courseId: session.courseId,
        contextMaterials,
        systemPrompt,
      })) {
        fullReply += chunk.text;
        if (chunk.tokensUsed) lastTokens = chunk.tokensUsed;
        yield chunk;
      }

      session.messages.push({ role: 'user', content, timestamp: new Date(), tokens: content.split(' ').length });
      session.messages.push({ role: 'assistant', content: fullReply, timestamp: new Date(), tokens: lastTokens });
      session.totalTokens += lastTokens;
      session.messageCount += 2;
      await self.sessionRepo.save(session);
    })();
  }

  async generateFlashcards(
    universityId: string,
    userId: string,
    text: string,
    options?: { courseId?: string; courseCode?: string; count?: number },
  ): Promise<FlashcardSet> {
    const contextMaterials = await this.getCourseMaterials(universityId, options?.courseId, options?.courseCode);
    const fullText = contextMaterials.length ? `${text}\n\nReference materials:\n${contextMaterials.join('\n')}` : text;

    const result = await this.aiService.generateFlashcards({
      text: fullText,
      universityId,
      userId,
      courseId: options?.courseId,
      count: options?.count ?? 10,
    });

    return {
      id: `fc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      courseId: options?.courseId,
      courseCode: options?.courseCode,
      flashcards: result.flashcards,
      tokensUsed: result.tokensUsed,
      generatedAt: new Date(),
    };
  }

  async generateCitation(
    universityId: string,
    userId: string,
    source: { title: string; authors?: string[]; year?: number; url?: string; journal?: string; volume?: string; issue?: string; pages?: string; publisher?: string },
    format: CitationFormat,
  ): Promise<CitationResult> {
    const result = await this.aiService.generateCitation({
      source,
      format,
      universityId,
      userId,
    });

    return { citation: result.citation, format: result.format };
  }

  async summarizePaper(
    universityId: string,
    userId: string,
    paperText: string,
    options?: { courseId?: string; maxLength?: number },
  ): Promise<PaperSummary> {
    const result = await this.aiService.summarize({
      text: paperText,
      universityId,
      userId,
      courseId: options?.courseId,
      maxLength: options?.maxLength,
    });

    const sectionPattern = /(?:^|\n)(?:#{1,3}\s*)?(?:\d+[\.\)]\s*)?([A-Z][^\n]{3,60})\s*\n/g;
    const sections: Array<{ title: string; summary: string }> = [];
    let match;
    while ((match = sectionPattern.exec(result.summary)) !== null) {
      sections.push({ title: match[1].trim(), summary: '' });
    }

    return {
      summary: result.summary,
      keyTopics: result.keyTopics,
      sections,
      tokensUsed: result.tokensUsed,
    };
  }

  async explainChapter(
    universityId: string,
    userId: string,
    chapterContent: string,
    options?: { courseId?: string; courseCode?: string; difficulty?: 'beginner' | 'intermediate' | 'advanced' },
  ): Promise<ChapterExplanation> {
    const contextMaterials = await this.getCourseMaterials(universityId, options?.courseId, options?.courseCode);

    const result = await this.aiService.explain({
      topic: chapterContent,
      universityId,
      userId,
      courseId: options?.courseId,
      courseCode: options?.courseCode,
      contextMaterials,
      difficulty: options?.difficulty ?? 'intermediate',
    });

    const questionPrompt = `Based on the explanation above, generate 3-5 practice questions a student should be able to answer.
Format: one question per line, prefixed with "Q:"`;

    const questionsResult = await this.aiService.generateText({
      prompt: `${questionPrompt}\n\nTopic: ${result.explanation.slice(0, 500)}`,
      universityId,
      userId,
      courseId: options?.courseId,
      maxTokens: 512,
      temperature: 0.5,
    });

    const practiceQuestions = questionsResult.text
      .split('\n')
      .map((l) => l.replace(/^Q:\s*/, '').trim())
      .filter((l) => l.length > 5);

    return {
      chapter: chapterContent.slice(0, 100),
      explanation: result.explanation,
      keyConcepts: result.relatedTopics,
      practiceQuestions,
      tokensUsed: result.tokensUsed + questionsResult.tokensUsed,
    };
  }

  async reviewAndImproveCV(
    universityId: string,
    userId: string,
    cvText: string,
    options?: { targetRole?: string; industry?: string },
  ): Promise<{
    score: number;
    strengths: string[];
    improvements: string[];
    suggestions: string[];
    rewrittenSections?: Record<string, string>;
    tokensUsed: number;
  }> {
    return this.aiService.reviewCV({
      cvText,
      universityId,
      userId,
      targetRole: options?.targetRole,
      industry: options?.industry,
    });
  }

  async draftCoverLetter(
    universityId: string,
    userId: string,
    cvText: string,
    jobDescription: string,
    companyName: string,
    roleTitle: string,
    options?: { tone?: 'professional' | 'enthusiastic' | 'formal' },
  ): Promise<{ coverLetter: string; tokensUsed: number }> {
    return this.aiService.generateCoverLetter({
      cvText,
      jobDescription,
      companyName,
      roleTitle,
      universityId,
      userId,
      tone: options?.tone ?? 'professional',
    });
  }

  async getSessions(universityId: string, userId: string): Promise<TutorSession[]> {
    return this.sessionRepo.find({
      where: { universityId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSessionById(universityId: string, sessionId: string): Promise<TutorSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, universityId } });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async endSession(universityId: string, sessionId: string, userId: string): Promise<TutorSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, universityId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new BadRequestException('Unauthorized');
    session.isActive = false;
    session.durationSeconds = Math.floor((Date.now() - session.createdAt.getTime()) / 1000);
    return this.sessionRepo.save(session);
  }

  async deleteSession(universityId: string, sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, universityId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new BadRequestException('Unauthorized');
    await this.sessionRepo.softRemove(session);
  }

  async getSessionStats(universityId: string, userId: string): Promise<{
    totalSessions: number;
    totalTokens: number;
    averageMessagesPerSession: number;
  }> {
    const sessions = await this.sessionRepo.find({ where: { universityId, userId } });
    return {
      totalSessions: sessions.length,
      totalTokens: sessions.reduce((sum, s) => sum + s.totalTokens, 0),
      averageMessagesPerSession: sessions.length
        ? sessions.reduce((sum, s) => sum + s.messageCount, 0) / sessions.length
        : 0,
    };
  }

  private buildSystemPrompt(mode: TutorMode, courseCode?: string, contextMaterials?: string[], performanceContext?: string): string {
    const coursePrefix = courseCode ? `[Course: ${courseCode}] ` : '';

    const basePrompts: Record<TutorMode, string> = {
      [TutorMode.STUDY]: `${coursePrefix}You are CampusGPT, an AI study tutor. Help students understand concepts through clear explanations, examples, and practice. Guide students toward understanding rather than just giving answers. Encourage active recall and spaced repetition.`,
      [TutorMode.EXAM]: `${coursePrefix}You are CampusGPT, an exam preparation tutor. Help students prepare for exams by identifying key topics, providing practice questions, and testing their knowledge. Focus on high-yield material and common exam patterns.`,
      [TutorMode.EXPLAIN]: `${coursePrefix}You are CampusGPT, an explainer. Break down complex topics into understandable parts. Use analogies, real-world examples, and visual descriptions. Start simple and build complexity.`,
      [TutorMode.FLASHCARDS]: `${coursePrefix}You are CampusGPT, a flashcard generator. Create effective study flashcards that test understanding, not just memorization. Use the SQ3R method: survey, question, read, recite, review.`,
      [TutorMode.QUIZ]: `${coursePrefix}You are CampusGPT, a quiz master. Generate challenging but fair quiz questions. After each answer, provide detailed feedback explaining why an answer is correct or incorrect.`,
    };

    let prompt = basePrompts[mode] ?? basePrompts[TutorMode.STUDY];

    if (contextMaterials?.length) {
      prompt += '\n\nUse the following course materials as context for your responses:\n';
      prompt += contextMaterials.map((m, i) => `[Material ${i + 1}]: ${m}`).join('\n\n');
    }

    if (performanceContext) {
      prompt += '\n\n' + performanceContext;
    }

    prompt += '\n\nAlways cite your sources when referencing course materials. Be honest about what you know and what you are uncertain about.';
    prompt +=
      '\n\nDefault to concise conversational answers (about 100-150 words) unless the student explicitly asks for depth, code, or a full walkthrough.' +
      ' Structured outputs (flashcards, quizzes, citations, CV reviews) must still be complete and follow their requested format.';

    return prompt;
  }

  private extractSources(responseText: string, contextMaterials: string[]): Array<{ title: string; url?: string; relevance: number }> {
    const sources: Array<{ title: string; relevance: number }> = [];
    const haystack = responseText.toLowerCase();

    for (const material of contextMaterials) {
      const title = material.split(':')[0].trim();
      if (!title) continue;
      const needle = title.toLowerCase().slice(0, 30);
      if (needle && haystack.includes(needle)) {
        sources.push({ title, relevance: 1 });
      }
    }

    return sources;
  }

  private getIntegrityNotice(mode: IntegrityMode): string | undefined {
    switch (mode) {
      case IntegrityMode.STRICT:
        return 'AI assistance is limited during assessments. Focus on independent problem-solving.';
      case IntegrityMode.OPEN:
        return 'AI is in explain-only mode. It will explain concepts but not generate solutions.';
      default:
        return undefined;
    }
  }
}
