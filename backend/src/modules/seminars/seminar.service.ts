import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seminar, SeminarType, SeminarStatus } from './entities/seminar.entity';

@Injectable()
export class SeminarService {
  private readonly logger = new Logger(SeminarService.name);

  constructor(
    @InjectRepository(Seminar)
    private readonly seminarRepo: Repository<Seminar>,
  ) {}

  async findAll(
    universityId: string,
    filters: { type?: SeminarType; status?: SeminarStatus; featured?: boolean; upcoming?: boolean } = {},
  ) {
    const where: any = { universityId };

    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.featured) where.isFeatured = true;

    if (filters.upcoming) {
      return this.seminarRepo.find({
        where: { ...where, status: SeminarStatus.OPEN },
        order: { startDate: 'ASC' },
      });
    }

    return this.seminarRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(universityId: string, id: string) {
    return this.seminarRepo.findOne({ where: { id, universityId } });
  }

  async getTypes(): Promise<SeminarType[]> {
    return Object.values(SeminarType);
  }
}
