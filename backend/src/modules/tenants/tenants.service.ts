import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University, UniversityStatus } from './entities/university.entity';
import { UniversityModule } from './entities/university-module.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(University) private uniRepo: Repository<University>,
    @InjectRepository(UniversityModule) private moduleRepo: Repository<UniversityModule>,
  ) {}

  async create(data: Partial<University>): Promise<University> {
    const university = this.uniRepo.create(data);
    return this.uniRepo.save(university);
  }

  async findById(id: string): Promise<University> {
    const uni = await this.uniRepo.findOne({ where: { id } });
    if (!uni) throw new NotFoundException('University not found');
    return uni;
  }

  async findBySlug(slug: string): Promise<University> {
    const uni = await this.uniRepo.findOne({ where: { slug } });
    if (!uni) throw new NotFoundException('University not found');
    return uni;
  }

  async getEnabledModules(universityId: string): Promise<UniversityModule[]> {
    return this.moduleRepo.find({ where: { universityId, enabled: true } });
  }

  async toggleModule(universityId: string, moduleKey: string, enabled: boolean): Promise<UniversityModule> {
    let module = await this.moduleRepo.findOne({
      where: { universityId, moduleKey },
    });
    if (!module) {
      module = this.moduleRepo.create({ universityId, moduleKey, enabled });
    } else {
      module.enabled = enabled;
    }
    return this.moduleRepo.save(module);
  }

  async isModuleEnabled(universityId: string, moduleKey: string): Promise<boolean> {
    const module = await this.moduleRepo.findOne({
      where: { universityId, moduleKey, enabled: true },
    });
    return !!module;
  }

  async updateBranding(universityId: string, branding: any): Promise<University> {
    await this.uniRepo.update(universityId, { branding });
    return this.findById(universityId);
  }

  async list(page = 1, limit = 20): Promise<{ items: University[]; total: number }> {
    const [items, total] = await this.uniRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }
}
