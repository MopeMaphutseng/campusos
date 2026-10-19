import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { LibraryItem, LibraryItemType } from '../../library/entities/library-item.entity';
import { Scholarship, ScholarshipStatus, ScholarshipType } from '../../scholarships/entities/scholarship.entity';
import { JobListing, JobStatus, JobType } from '../../jobs/entities/job-listing.entity';
import { ResearchCall, ResearchCallStatus, ResearchCallType } from '../../research-hub/entities/research-call.entity';
import { CampusMapLocation, MapLocationType } from '../../campus-life/entities/campus-map.entity';
import { NewsArticle, NewsCategory } from '../../news/entities/news-article.entity';
import { Seminar, SeminarStatus, SeminarType } from '../../seminars/entities/seminar.entity';
import { MentorProfile, MentorStatus } from '../../mentorship/entities/mentor-profile.entity';
import { User, UserRole } from '../../tenants/entities/user.entity';
import { TargetingService } from '../../targeting/targeting.service';

export type AdminContentType =
  | 'library'
  | 'scholarship'
  | 'job'
  | 'research'
  | 'location'
  | 'news'
  | 'seminar'
  | 'mentor';

interface FieldSpec {
  fields: string[];
  required: string[];
  defaults?: Record<string, any>;
}

const CONTENT_SPECS: Record<AdminContentType, FieldSpec> = {
  library: {
    fields: [
      'title', 'description', 'type', 'courseCode', 'faculty', 'topic',
      'fileUrl', 'externalUrl', 'content',
    ],
    required: ['title', 'faculty'],
    defaults: { type: LibraryItemType.NOTES },
  },
  scholarship: {
    fields: [
      'title', 'description', 'amount', 'currency', 'type', 'status', 'deadline',
      'availableSlots', 'eligibility', 'requiredDocuments', 'applicationUrl',
      'providerName',
    ],
    required: ['title', 'description'],
    defaults: { type: ScholarshipType.MERIT, status: ScholarshipStatus.DRAFT, currency: 'USD', amount: 0 },
  },
  job: {
    fields: [
      'title', 'description', 'type', 'status', 'company', 'companyLogoUrl',
      'location', 'isRemote', 'salaryMin', 'salaryMax', 'currency', 'deadline',
      'skills', 'requirements', 'isVerified',
    ],
    required: ['title', 'description'],
    defaults: { type: JobType.FULL_TIME, status: JobStatus.DRAFT, currency: 'USD' },
  },
  research: {
    fields: [
      'title', 'description', 'type', 'status', 'department', 'field',
      'positionsAvailable', 'deadline', 'stipendAmount', 'currency',
      'requiredSkills', 'preferredSkills',
    ],
    required: ['title', 'description'],
    defaults: { type: ResearchCallType.RA_POSITION, status: ResearchCallStatus.OPEN, currency: 'USD' },
  },
  location: {
    fields: [
      'name', 'description', 'type', 'latitude', 'longitude', 'address',
      'building', 'floor', 'room', 'imageUrl', 'openingHours',
    ],
    required: ['name', 'type', 'latitude', 'longitude'],
    defaults: { type: MapLocationType.ACADEMIC },
  },
  news: {
    fields: [
      'title', 'content', 'summary', 'category', 'imageUrl',
      'tags', 'isPublished', 'publishedAt',
    ],
    required: ['title', 'content'],
    defaults: { category: NewsCategory.CAMPUS, isPublished: true },
  },
  seminar: {
    fields: [
      'title', 'description', 'type', 'status', 'location', 'isOnline',
      'onlineUrl', 'startDate', 'endDate', 'deadline', 'organizerName',
      'organizerEmail', 'fee', 'currency', 'maxParticipants', 'tags',
      'speakers', 'imageUrl', 'isFeatured',
    ],
    required: ['title'],
    defaults: { status: SeminarStatus.OPEN, type: SeminarType.SEMINAR, currency: 'LSL' },
  },
  mentor: {
    fields: ['bio', 'expertise', 'tags', 'availability', 'maxMentees', 'socialLinks', 'status'],
    required: [],
    defaults: { status: MentorStatus.AVAILABLE, maxMentees: 10 },
  },
};

@Injectable()
export class AdminContentService {
  private readonly logger = new Logger(AdminContentService.name);

  constructor(
    @InjectRepository(LibraryItem) private library: Repository<LibraryItem>,
    @InjectRepository(Scholarship) private scholarships: Repository<Scholarship>,
    @InjectRepository(JobListing) private jobs: Repository<JobListing>,
    @InjectRepository(ResearchCall) private research: Repository<ResearchCall>,
    @InjectRepository(CampusMapLocation) private locations: Repository<CampusMapLocation>,
    @InjectRepository(NewsArticle) private news: Repository<NewsArticle>,
    @InjectRepository(Seminar) private seminars: Repository<Seminar>,
    @InjectRepository(MentorProfile) private mentors: Repository<MentorProfile>,
    @InjectRepository(User) private users: Repository<User>,
    private targeting: TargetingService,
  ) {}

  private repo(type: AdminContentType): Repository<any> {
    switch (type) {
      case 'library': return this.library;
      case 'scholarship': return this.scholarships;
      case 'job': return this.jobs;
      case 'research': return this.research;
      case 'location': return this.locations;
      case 'news': return this.news;
      case 'seminar': return this.seminars;
      case 'mentor': return this.mentors;
      default: throw new BadRequestException(`Unknown content type: ${type}`);
    }
  }

  private assertType(type: string): AdminContentType {
    if (!CONTENT_SPECS[type as AdminContentType]) {
      throw new BadRequestException(`Unknown content type: ${type}`);
    }
    return type as AdminContentType;
  }

  private pick(type: AdminContentType, body: any): Record<string, any> {
    const spec = CONTENT_SPECS[type];
    const out: Record<string, any> = { ...(spec.defaults || {}) };
    for (const f of spec.fields) {
      if (body[f] !== undefined) out[f] = body[f];
    }
    for (const r of spec.required) {
      if (out[r] === undefined || out[r] === null || out[r] === '') {
        throw new BadRequestException(`${r} is required`);
      }
    }
    return out;
  }

  async list(type: string, universityId: string): Promise<any[]> {
    const t = this.assertType(type);
    const rows = await this.repo(t).find({
      where: { universityId },
      order: { createdAt: 'DESC' },
      take: 500,
    });
    if (t === 'mentor') {
      const userIds = rows.map((r) => r.userId).filter(Boolean);
      const userList = userIds.length ? await this.users.find({ where: userIds.map((id) => ({ id })) }) : [];
      const byId = new Map(userList.map((u) => [u.id, u]));
      const enriched = await Promise.all(
        rows.map(async (r) => ({
          ...r,
          userName: byId.get(r.userId)
            ? `${byId.get(r.userId)!.firstName} ${byId.get(r.userId)!.lastName}`.trim()
            : undefined,
          userEmail: byId.get(r.userId)?.email,
          targetCourseCodes: await this.targeting.getTargeting(universityId, t, r.id),
        })),
      );
      return enriched;
    }
    return Promise.all(
      rows.map(async (r) => ({
        ...r,
        targetCourseCodes: await this.targeting.getTargeting(universityId, t, r.id),
      })),
    );
  }

  async create(type: string, universityId: string, userId: string, body: any): Promise<any> {
    const t = this.assertType(type);
    const data = this.pick(t, body);
    data.universityId = universityId;

    if (t === 'library') {
      data.uploadedBy = body.uploadedBy || userId || null;
      if (!data.uploadedBy) data.uploadedBy = null;
    }
    if (t === 'news') {
      data.authorId = body.authorId || userId;
      data.authorName = body.authorName || (await this.userName(userId));
      if (data.isPublished && !data.publishedAt) data.publishedAt = new Date();
    }
    if (t === 'mentor') {
      data.userId = await this.resolveMentorUserId(universityId, body);
    }

    const saved = await this.repo(t).save(this.repo(t).create(data));
    await this.targeting.setTargeting(universityId, t, saved.id, body.targetCourseCodes || []);
    return { ...saved, targetCourseCodes: body.targetCourseCodes || [] };
  }

  async update(type: string, universityId: string, id: string, body: any): Promise<any> {
    const t = this.assertType(type);
    const repo = this.repo(t);
    const existing = await repo.findOne({ where: { id, universityId } });
    if (!existing) throw new NotFoundException(`${t} ${id} not found`);
    const data = this.pick(t, { ...existing, ...body });
    Object.assign(existing, data);
    const saved = await repo.save(existing);
    if (body.targetCourseCodes !== undefined) {
      await this.targeting.setTargeting(universityId, t, id, body.targetCourseCodes);
    }
    return { ...saved, targetCourseCodes: await this.targeting.getTargeting(universityId, t, id) };
  }

  async remove(type: string, universityId: string, id: string): Promise<{ deleted: boolean }> {
    const t = this.assertType(type);
    const existing = await this.repo(t).findOne({ where: { id, universityId } });
    if (!existing) throw new NotFoundException(`${t} ${id} not found`);
    await this.repo(t).softRemove(existing);
    await this.targeting.setTargeting(universityId, t, id, []);
    return { deleted: true };
  }

  private async userName(userId: string): Promise<string> {
    const u = await this.users.findOne({ where: { id: userId } });
    return u ? `${u.firstName} ${u.lastName}`.trim() : 'Administrator';
  }

  /** Mentors need a backing user; create one on the fly when only a name/email is given. */
  private async resolveMentorUserId(universityId: string, body: any): Promise<string> {
    if (body.userId) return body.userId;
    if (!body.email || !body.firstName) {
      throw new BadRequestException('Mentor requires userId, or email + firstName + lastName');
    }
    const email = String(body.email).toLowerCase();
    const existing = await this.users.findOne({ where: { universityId, email } });
    if (existing) return existing.id;
    const passwordHash = await bcrypt.hash(body.password || `Mentor@${Date.now()}`, 12);
    const user = await this.users.save(
      this.users.create({
        universityId,
        email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName || '',
        role: UserRole.MENTOR,
      }),
    );
    return user.id;
  }
}
