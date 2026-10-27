import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../tenants/entities/user.entity';
import {
  Enrollment,
  EnrollmentStatus,
} from '../academics/entities/enrollment.entity';
import {
  TimetableEntry,
  DayOfWeek,
} from '../academics/entities/timetable.entity';
import { Conversation } from '../messaging/entities/conversation.entity';
import { Message, MessageStatus } from '../messaging/entities/message.entity';

const DAY_NAMES: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

export interface WeatherInfo {
  temp: number | null;
  condition: string;
  city: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(TimetableEntry)
    private readonly timetableRepo: Repository<TimetableEntry>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async getTodayDashboard(userId: string, universityId: string) {
    const [user, enrollments, unreadMessages, weather] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId, universityId } }),
      this.enrollmentRepo.find({
        where: {
          universityId,
          userId,
          status: EnrollmentStatus.ENROLLED,
        },
        relations: ['course'],
      }),
      this.countUnreadMessages(userId, universityId),
      this.fetchWeather(),
    ]);

    const courseIds = enrollments.map((e) => e.courseId);
    const today = DAY_NAMES[new Date().getDay()];

    const todayEntries = courseIds.length
      ? await this.timetableRepo
          .createQueryBuilder('t')
          .where('t.universityId = :universityId', { universityId })
          .andWhere('t.courseId IN (:...courseIds)', { courseIds })
          .andWhere('t.dayOfWeek = :today', { today })
          .orderBy('t.startTime', 'ASC')
          .getMany()
      : [];

    const nextClass = this.pickNextClass(todayEntries);
    const firstName = user?.firstName ?? 'there';

    return {
      greeting: this.getGreeting(firstName),
      nextClass,
      upcomingDeadline: null,
      aiSuggestedAction: {
        type: 'study_reminder',
        message: nextClass
          ? `Prepare for ${nextClass.courseName} ${nextClass.countdownFormatted}`
          : 'No classes left today - a good time to review your notes',
        module: nextClass ? 'academics' : 'library',
      },
      weather,
      highlightedOpportunity: null,
      quickStats: {
        courses: enrollments.length,
        unreadMessages,
        upcomingEvents: 0,
        marketplaceAlerts: 0,
      },
    };
  }

  private pickNextClass(entries: TimetableEntry[]) {
    if (entries.length === 0) return null;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const toMinutes = (time: string): number => {
      const [h, m] = time.split(':');
      return parseInt(h, 10) * 60 + parseInt(m, 10);
    };

    const upcoming = entries.find((e) => toMinutes(e.startTime) >= nowMinutes);
    const current = entries.find(
      (e) =>
        toMinutes(e.startTime) <= nowMinutes &&
        toMinutes(e.endTime) >= nowMinutes,
    );

    const entry = current ?? upcoming ?? entries[entries.length - 1];
    const startMinutes = toMinutes(entry.startTime);
    const diff = startMinutes - nowMinutes;
    const isHappeningNow =
      toMinutes(entry.startTime) <= nowMinutes &&
      toMinutes(entry.endTime) >= nowMinutes;

    let countdownFormatted: string;
    if (isHappeningNow) {
      countdownFormatted = `now until ${entry.endTime.slice(0, 5)}`;
    } else if (diff > 0) {
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      countdownFormatted =
        hours > 0
          ? `in ${hours}h ${mins}m`
          : `in ${mins} minute${mins === 1 ? '' : 's'}`;
    } else {
      countdownFormatted = 'earlier today';
    }

    return {
      id: entry.id,
      courseCode: entry.courseCode,
      courseName: entry.courseName,
      startTime: entry.startTime.slice(0, 5),
      endTime: entry.endTime.slice(0, 5),
      venue: entry.venue,
      building: entry.building,
      instructorName: entry.instructorName,
      type: entry.type,
      isHappeningNow,
      countdownFormatted,
    };
  }

  private async countUnreadMessages(
    userId: string,
    universityId: string,
  ): Promise<number> {
    try {
      const conversations = await this.conversationRepo
        .createQueryBuilder('c')
        .where('c.universityId = :universityId', { universityId })
        .andWhere('c.isActive = true')
        .andWhere(':userId = ANY(SELECT jsonb_array_elements_text(c.participantIds))', {
          userId,
        })
        .getMany();

      const conversationIds = conversations.map((c) => c.id);
      if (conversationIds.length === 0) return 0;

      const messages = await this.messageRepo
        .createQueryBuilder('m')
        .where('m.universityId = :universityId', { universityId })
        .andWhere('m.conversationId IN (:...conversationIds)', { conversationIds })
        .andWhere('m.senderId != :userId', { userId })
        .andWhere('m.status != :deleted', { deleted: MessageStatus.DELETED })
        .getMany();

      return messages.filter(
        (m) => !(m.readBy ?? []).some((r) => r.userId === userId),
      ).length;
    } catch (err) {
      this.logger.warn(`Unread message count failed: ${(err as Error).message}`);
      return 0;
    }
  }

  private async fetchWeather(): Promise<WeatherInfo> {
    try {
      const url =
        'https://api.open-meteo.com/v1/forecast?latitude=-29.3156&longitude=27.4869&current=temperature_2m,weather_code&timezone=Africa%2FMaseru';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`weather http ${res.status}`);
      const json: any = await res.json();
      const temp = json?.current?.temperature_2m ?? null;
      const code = json?.current?.weather_code ?? 0;
      return {
        temp: typeof temp === 'number' ? temp : null,
        condition: this.weatherCodeToCondition(code),
        city: 'Roma',
      };
    } catch {
      return { temp: null, condition: 'unknown', city: 'Roma' };
    }
  }

  private weatherCodeToCondition(code: number): string {
    if (code === 0) return 'clear';
    if (code <= 3) return 'partly_cloudy';
    if (code <= 48) return 'fog';
    if (code <= 67) return 'rain';
    if (code <= 77) return 'snow';
    if (code <= 82) return 'showers';
    if (code <= 86) return 'snow_showers';
    if (code <= 99) return 'thunderstorm';
    return 'unknown';
  }

  private getGreeting(name: string): string {
    const hour = new Date().getHours();
    const period =
      hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return `${period}, ${name}`;
  }
}
