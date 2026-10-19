import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResearchCall, ResearchCallStatus, ResearchCallType } from './entities/research-call.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ResearchHubService {
  constructor(
    @InjectRepository(ResearchCall) private callRepo: Repository<ResearchCall>,
  ) {}

  async create(universityId: string, supervisorId: string, data: Partial<ResearchCall>): Promise<ResearchCall> {
    const call = this.callRepo.create({ ...data, universityId, supervisorId });
    return this.callRepo.save(call);
  }

  async findAll(universityId: string, query: PaginationDto, filters?: {
    type?: ResearchCallType;
    status?: ResearchCallStatus;
    department?: string;
  }): Promise<PaginatedResult<ResearchCall>> {
    const qb = this.callRepo.createQueryBuilder('rc')
      .where('rc.universityId = :universityId', { universityId });

    if (filters?.type) {
      qb.andWhere('rc.type = :type', { type: filters.type });
    }
    if (filters?.status) {
      qb.andWhere('rc.status = :status', { status: filters.status });
    } else {
      qb.andWhere('rc.status = :status', { status: ResearchCallStatus.OPEN });
    }
    if (filters?.department) {
      qb.andWhere('rc.department = :department', { department: filters.department });
    }
    if (query.search) {
      qb.andWhere('(rc.title ILIKE :search OR rc.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [items, total] = await qb
      .orderBy(`rc.${query.sortBy}`, query.sortOrder)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findById(universityId: string, id: string): Promise<ResearchCall> {
    const call = await this.callRepo.findOne({ where: { id, universityId } });
    if (!call) throw new NotFoundException('Research call not found');
    return call;
  }

  async update(universityId: string, id: string, supervisorId: string, data: Partial<ResearchCall>): Promise<ResearchCall> {
    const call = await this.callRepo.findOne({ where: { id, universityId } });
    if (!call) throw new NotFoundException('Research call not found');
    if (call.supervisorId !== supervisorId) throw new ForbiddenException('Not your research call');
    Object.assign(call, data);
    return this.callRepo.save(call);
  }

  async delete(universityId: string, id: string, supervisorId: string): Promise<void> {
    const call = await this.callRepo.findOne({ where: { id, universityId } });
    if (!call) throw new NotFoundException('Research call not found');
    if (call.supervisorId !== supervisorId) throw new ForbiddenException('Not your research call');
    call.status = ResearchCallStatus.CLOSED;
    await this.callRepo.save(call);
  }

  async getAiMatches(universityId: string, userProfile: {
    skills?: string[];
    gpa?: number;
    yearOfStudy?: number;
    department?: string;
  }): Promise<Array<{ call: ResearchCall; matchScore: number; reasons: string[] }>> {
    const openCalls = await this.callRepo.find({
      where: { universityId, status: ResearchCallStatus.OPEN },
    });

    return openCalls
      .map((c) => {
        let score = 40;
        const reasons: string[] = [];

        if (c.requiredSkills.length && userProfile.skills?.length) {
          const matched = c.requiredSkills.filter((s) =>
            userProfile.skills.some((us) => us.toLowerCase().includes(s.toLowerCase())),
          );
          if (matched.length > 0) {
            score += (matched.length / c.requiredSkills.length) * 40;
            reasons.push(`Matched skills: ${matched.join(', ')}`);
          }
        }

        if (c.eligibility.minGpa && userProfile.gpa) {
          if (userProfile.gpa >= c.eligibility.minGpa) {
            score += 10;
            reasons.push('GPA requirement met');
          }
        }

        if (c.eligibility.yearOfStudy?.length && userProfile.yearOfStudy) {
          if (c.eligibility.yearOfStudy.includes(userProfile.yearOfStudy)) {
            score += 10;
            reasons.push('Year of study matches');
          }
        }

        return { call: c, matchScore: Math.min(100, Math.max(0, score)), reasons };
      })
      .filter((m) => m.matchScore > 30)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  async getSupervisorCalls(universityId: string, supervisorId: string): Promise<ResearchCall[]> {
    return this.callRepo.find({
      where: { universityId, supervisorId },
      order: { createdAt: 'DESC' },
    });
  }
}
