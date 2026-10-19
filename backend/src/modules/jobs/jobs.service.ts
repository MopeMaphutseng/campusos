import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobListing, JobStatus, JobType } from './entities/job-listing.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { AIService } from '../ai-tutor/services/ai.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobListing) private jobRepo: Repository<JobListing>,
    private aiService: AIService,
  ) {}

  async create(universityId: string, employerId: string, data: Partial<JobListing>): Promise<JobListing> {
    const job = this.jobRepo.create({ ...data, universityId, employerId });
    return this.jobRepo.save(job);
  }

  async findAll(universityId: string, query: PaginationDto, filters?: {
    type?: JobType;
    status?: JobStatus;
    isRemote?: boolean;
    skills?: string[];
  }): Promise<PaginatedResult<JobListing>> {
    const qb = this.jobRepo.createQueryBuilder('job')
      .where('job.universityId = :universityId', { universityId });

    if (filters?.status) {
      qb.andWhere('job.status = :status', { status: filters.status });
    } else {
      qb.andWhere('job.status = :status', { status: JobStatus.ACTIVE });
    }
    if (filters?.type) {
      qb.andWhere('job.type = :type', { type: filters.type });
    }
    if (filters?.isRemote !== undefined) {
      qb.andWhere('job.isRemote = :isRemote', { isRemote: filters.isRemote });
    }
    if (query.search) {
      qb.andWhere('(job.title ILIKE :search OR job.description ILIKE :search OR job.company ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [items, total] = await qb
      .orderBy(`job.${query.sortBy}`, query.sortOrder)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findById(universityId: string, id: string): Promise<JobListing> {
    const job = await this.jobRepo.findOne({ where: { id, universityId } });
    if (!job) throw new NotFoundException('Job listing not found');
    job.viewCount += 1;
    await this.jobRepo.save(job);
    return job;
  }

  async update(universityId: string, id: string, userId: string, data: Partial<JobListing>): Promise<JobListing> {
    const job = await this.jobRepo.findOne({ where: { id, universityId } });
    if (!job) throw new NotFoundException('Job listing not found');
    if (job.employerId !== userId) throw new ForbiddenException('Not your listing');
    Object.assign(job, data);
    return this.jobRepo.save(job);
  }

  async delete(universityId: string, id: string, userId: string): Promise<void> {
    const job = await this.jobRepo.findOne({ where: { id, universityId } });
    if (!job) throw new NotFoundException('Job listing not found');
    if (job.employerId !== userId) throw new ForbiddenException('Not your listing');
    job.status = JobStatus.CLOSED;
    await this.jobRepo.save(job);
  }

  async reviewCv(universityId: string, userId: string, cvData: {
    education?: string;
    skills?: string[];
    experience?: string;
  }): Promise<{
    score: number;
    strengths: string[];
    improvements: string[];
    suggestedRoles: string[];
  }> {
    const parts = [
      (cvData.education && cvData.education.trim()) ? `EDUCATION:\n${cvData.education}` : null,
      (cvData.skills && cvData.skills.length) ? `SKILLS:\n${cvData.skills.join(', ')}` : null,
      (cvData.experience && cvData.experience.trim()) ? `EXPERIENCE:\n${cvData.experience}` : null,
    ].filter((p): p is string => !!p);
    const cvText = parts.join('\n\n');

    if (!cvText.trim()) {
      throw new BadRequestException('Provide at least one of education, skills or experience to review.');
    }

    const result = await this.aiService.reviewCV({
      cvText,
      universityId,
      userId,
    });

    return {
      score: result.score,
      strengths: result.strengths,
      improvements: [...result.improvements, ...result.suggestions].slice(0, 10),
      suggestedRoles: [],
    };
  }
}
