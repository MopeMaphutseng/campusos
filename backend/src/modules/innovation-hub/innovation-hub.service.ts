import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InnovationProject, ProjectStatus } from './entities/project.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class InnovationHubService {
  constructor(
    @InjectRepository(InnovationProject) private projectRepo: Repository<InnovationProject>,
  ) {}

  async create(universityId: string, leadId: string, data: Partial<InnovationProject>): Promise<InnovationProject> {
    const project = this.projectRepo.create({
      ...data,
      universityId,
      leadId,
      teamMembers: [leadId, ...(data.teamMembers || [])],
    });
    return this.projectRepo.save(project);
  }

  async findAll(universityId: string, query: PaginationDto, filters?: {
    status?: ProjectStatus;
    tag?: string;
  }): Promise<PaginatedResult<InnovationProject>> {
    const qb = this.projectRepo.createQueryBuilder('p')
      .where('p.universityId = :universityId', { universityId });

    if (filters?.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }
    if (query.search) {
      qb.andWhere('(p.name ILIKE :search OR p.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [items, total] = await qb
      .orderBy(`p.${query.sortBy}`, query.sortOrder)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findById(universityId: string, id: string): Promise<InnovationProject> {
    const project = await this.projectRepo.findOne({ where: { id, universityId } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(universityId: string, id: string, userId: string, data: Partial<InnovationProject>): Promise<InnovationProject> {
    const project = await this.projectRepo.findOne({ where: { id, universityId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.leadId !== userId) throw new ForbiddenException('Not the project lead');
    Object.assign(project, data);
    return this.projectRepo.save(project);
  }

  async delete(universityId: string, id: string, userId: string): Promise<void> {
    const project = await this.projectRepo.findOne({ where: { id, universityId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.leadId !== userId) throw new ForbiddenException('Not the project lead');
    project.status = ProjectStatus.ABANDONED;
    await this.projectRepo.save(project);
  }

  async joinProject(universityId: string, id: string, userId: string): Promise<InnovationProject> {
    const project = await this.projectRepo.findOne({ where: { id, universityId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.teamMembers.includes(userId)) throw new Error('Already a team member');
    project.teamMembers = [...project.teamMembers, userId];
    if (project.openRoles > 0) project.openRoles -= 1;
    return this.projectRepo.save(project);
  }

  async leaveProject(universityId: string, id: string, userId: string): Promise<InnovationProject> {
    const project = await this.projectRepo.findOne({ where: { id, universityId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.leadId === userId) throw new Error('Lead cannot leave; transfer ownership first');
    project.teamMembers = project.teamMembers.filter((id) => id !== userId);
    return this.projectRepo.save(project);
  }

  async starProject(universityId: string, id: string): Promise<InnovationProject> {
    const project = await this.projectRepo.findOne({ where: { id, universityId } });
    if (!project) throw new NotFoundException('Project not found');
    project.starCount += 1;
    return this.projectRepo.save(project);
  }

  async getFeatured(universityId: string): Promise<InnovationProject[]> {
    return this.projectRepo.find({
      where: { universityId, isFeatured: true, status: ProjectStatus.IN_PROGRESS },
      order: { starCount: 'DESC' },
      take: 10,
    });
  }
}
