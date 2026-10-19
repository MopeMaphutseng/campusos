import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scholarship, ScholarshipStatus } from './entities/scholarship.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ScholarshipsService {
  constructor(
    @InjectRepository(Scholarship) private scholarshipRepo: Repository<Scholarship>,
  ) {}

  async create(universityId: string, data: Partial<Scholarship>): Promise<Scholarship> {
    const scholarship = this.scholarshipRepo.create({ ...data, universityId });
    return this.scholarshipRepo.save(scholarship);
  }

  async findAll(universityId: string, query: PaginationDto, filters?: {
    status?: ScholarshipStatus;
    type?: string;
  }): Promise<PaginatedResult<Scholarship>> {
    const qb = this.scholarshipRepo.createQueryBuilder('s')
      .where('s.universityId = :universityId', { universityId });

    if (filters?.status) {
      qb.andWhere('s.status = :status', { status: filters.status });
    }
    if (filters?.type) {
      qb.andWhere('s.type = :type', { type: filters.type });
    }
    if (query.search) {
      qb.andWhere('(s.title ILIKE :search OR s.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [items, total] = await qb
      .orderBy(`s.${query.sortBy}`, query.sortOrder)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findById(universityId: string, id: string): Promise<Scholarship> {
    const scholarship = await this.scholarshipRepo.findOne({ where: { id, universityId } });
    if (!scholarship) throw new NotFoundException('Scholarship not found');
    return scholarship;
  }

  async update(universityId: string, id: string, data: Partial<Scholarship>): Promise<Scholarship> {
    const scholarship = await this.findById(universityId, id);
    Object.assign(scholarship, data);
    return this.scholarshipRepo.save(scholarship);
  }

  async delete(universityId: string, id: string): Promise<void> {
    const scholarship = await this.findById(universityId, id);
    await this.scholarshipRepo.softRemove(scholarship);
  }

  async getAiMatches(universityId: string, userId: string, userProfile: {
    gpa?: number;
    yearOfStudy?: number;
    department?: string;
  }): Promise<Array<{ scholarship: Scholarship; matchScore: number; reasons: string[] }>> {
    const openScholarships = await this.scholarshipRepo.find({
      where: { universityId, status: ScholarshipStatus.OPEN },
    });

    return openScholarships
      .map((s) => {
        let score = 50;
        const reasons: string[] = [];

        if (s.eligibility.minGpa && userProfile.gpa) {
          if (userProfile.gpa >= s.eligibility.minGpa) {
            score += 20;
            reasons.push(`GPA ${userProfile.gpa} meets minimum ${s.eligibility.minGpa}`);
          } else {
            score -= 30;
          }
        }

        if (s.eligibility.yearOfStudy?.length && userProfile.yearOfStudy) {
          if (s.eligibility.yearOfStudy.includes(userProfile.yearOfStudy)) {
            score += 15;
            reasons.push('Year of study matches');
          }
        }

        if (s.eligibility.departments?.length && userProfile.department) {
          if (s.eligibility.departments.includes(userProfile.department)) {
            score += 15;
            reasons.push('Department matches');
          }
        }

        return { scholarship: s, matchScore: Math.min(100, Math.max(0, score)), reasons };
      })
      .filter((m) => m.matchScore > 30)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  async getUpcomingDeadlines(universityId: string): Promise<Scholarship[]> {
    return this.scholarshipRepo.find({
      where: { universityId, status: ScholarshipStatus.OPEN },
      order: { deadline: 'ASC' },
      take: 10,
    });
  }
}
