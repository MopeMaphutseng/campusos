import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AlumniProfile } from './entities/alumni-profile.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class AlumniService {
  constructor(
    @InjectRepository(AlumniProfile) private alumniRepo: Repository<AlumniProfile>,
  ) {}

  async createProfile(universityId: string, userId: string, data: Partial<AlumniProfile>): Promise<AlumniProfile> {
    const profile = this.alumniRepo.create({
      ...data,
      universityId,
      userId,
    });
    return this.alumniRepo.save(profile);
  }

  async findAll(
    universityId: string,
    query: PaginationDto,
    filters?: { industry?: string; graduationYear?: number; isMentor?: boolean },
  ): Promise<PaginatedResult<AlumniProfile>> {
    const qb: SelectQueryBuilder<AlumniProfile> = this.alumniRepo
      .createQueryBuilder('alumni')
      .where('alumni.universityId = :universityId', { universityId });

    if (filters?.industry) {
      qb.andWhere('alumni.industry = :industry', { industry: filters.industry });
    }
    if (filters?.graduationYear) {
      qb.andWhere('alumni.graduationYear = :graduationYear', { graduationYear: filters.graduationYear });
    }
    if (filters?.isMentor !== undefined) {
      qb.andWhere('alumni.isMentor = :isMentor', { isMentor: filters.isMentor });
    }

    if (query.search) {
      qb.andWhere(
        '(alumni.department ILIKE :search OR alumni.currentCompany ILIKE :search OR alumni.bio ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const total = await qb.getCount();
    const items = await qb
      .orderBy(`alumni.${query.sortBy || 'createdAt'}`, query.sortOrder || 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getMany();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findMentorPool(universityId: string): Promise<AlumniProfile[]> {
    return this.alumniRepo.find({
      where: { universityId, isMentor: true, availableForMentoring: true },
      order: { rating: 'DESC' },
    });
  }

  async findById(universityId: string, id: string): Promise<AlumniProfile> {
    const profile = await this.alumniRepo.findOne({ where: { id, universityId } });
    if (!profile) throw new NotFoundException('Alumni profile not found');
    return profile;
  }

  async updateProfile(universityId: string, id: string, data: Partial<AlumniProfile>): Promise<AlumniProfile> {
    const profile = await this.findById(universityId, id);
    Object.assign(profile, data);
    return this.alumniRepo.save(profile);
  }

  async deleteProfile(universityId: string, id: string): Promise<void> {
    const profile = await this.findById(universityId, id);
    await this.alumniRepo.remove(profile);
  }

  async getIndustries(universityId: string): Promise<string[]> {
    const result = await this.alumniRepo
      .createQueryBuilder('alumni')
      .select('DISTINCT alumni.industry', 'industry')
      .where('alumni.universityId = :universityId', { universityId })
      .andWhere('alumni.industry IS NOT NULL')
      .getRawMany();
    return result.map((r) => r.industry).filter(Boolean);
  }

  async getStatistics(universityId: string): Promise<{
    totalAlumni: number;
    totalMentors: number;
    industryBreakdown: Record<string, number>;
    graduationYearBreakdown: Record<string, number>;
  }> {
    const totalAlumni = await this.alumniRepo.count({ where: { universityId } });
    const totalMentors = await this.alumniRepo.count({ where: { universityId, isMentor: true } });

    const industryRows = await this.alumniRepo
      .createQueryBuilder('alumni')
      .select('alumni.industry', 'industry')
      .addSelect('COUNT(*)', 'count')
      .where('alumni.universityId = :universityId', { universityId })
      .groupBy('alumni.industry')
      .getRawMany();

    const yearRows = await this.alumniRepo
      .createQueryBuilder('alumni')
      .select('alumni.graduationYear', 'year')
      .addSelect('COUNT(*)', 'count')
      .where('alumni.universityId = :universityId', { universityId })
      .groupBy('alumni.graduationYear')
      .getRawMany();

    return {
      totalAlumni,
      totalMentors,
      industryBreakdown: industryRows.reduce(
        (acc, r) => ({ ...acc, [r.industry || 'Unknown']: parseInt(r.count) }),
        {} as Record<string, number>,
      ),
      graduationYearBreakdown: yearRows.reduce(
        (acc, r) => ({ ...acc, [String(r.year)]: parseInt(r.count) }),
        {} as Record<string, number>,
      ),
    };
  }
}
