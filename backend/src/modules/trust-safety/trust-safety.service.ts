import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus, ReportCategory, ReportTargetType } from './entities/report.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class TrustSafetyService {
  constructor(
    @InjectRepository(Report) private reportRepo: Repository<Report>,
  ) {}

  async createReport(universityId: string, reporterId: string, data: {
    targetType: ReportTargetType;
    targetId: string;
    category: ReportCategory;
    reason: string;
    evidenceUrls?: string;
  }): Promise<Report> {
    const report = this.reportRepo.create({
      universityId,
      reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      category: data.category,
      reason: data.reason,
      evidenceUrls: data.evidenceUrls,
      status: ReportStatus.PENDING,
      timeline: [{
        action: 'created',
        performedBy: reporterId,
        timestamp: new Date(),
      }],
      fraudScore: this.calculateInitialFraudScore(data.category),
      isAutoDetected: false,
    });
    return this.reportRepo.save(report);
  }

  async findReports(universityId: string, query: PaginationDto, filters?: {
    status?: ReportStatus;
    category?: ReportCategory;
    targetType?: ReportTargetType;
  }): Promise<PaginatedResult<Report>> {
    const qb = this.reportRepo.createQueryBuilder('r')
      .where('r.universityId = :universityId', { universityId });

    if (filters?.status) {
      qb.andWhere('r.status = :status', { status: filters.status });
    }
    if (filters?.category) {
      qb.andWhere('r.category = :category', { category: filters.category });
    }
    if (filters?.targetType) {
      qb.andWhere('r.targetType = :targetType', { targetType: filters.targetType });
    }

    const [items, total] = await qb
      .orderBy('r.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findReportById(universityId: string, id: string): Promise<Report> {
    const report = await this.reportRepo.findOne({ where: { id, universityId } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async assignReport(universityId: string, id: string, assignedTo: string): Promise<Report> {
    const report = await this.reportRepo.findOne({ where: { id, universityId } });
    if (!report) throw new NotFoundException('Report not found');
    report.assignedTo = assignedTo;
    report.status = ReportStatus.REVIEWING;
    report.timeline = [...report.timeline, {
      action: 'assigned',
      performedBy: assignedTo,
      timestamp: new Date(),
    }];
    return this.reportRepo.save(report);
  }

  async resolveReport(universityId: string, id: string, resolution: string): Promise<Report> {
    const report = await this.reportRepo.findOne({ where: { id, universityId } });
    if (!report) throw new NotFoundException('Report not found');
    report.status = ReportStatus.RESOLVED;
    report.resolution = resolution;
    report.timeline = [...report.timeline, {
      action: 'resolved',
      performedBy: report.assignedTo || 'system',
      timestamp: new Date(),
      notes: resolution,
    }];
    return this.reportRepo.save(report);
  }

  async dismissReport(universityId: string, id: string, reason: string): Promise<Report> {
    const report = await this.reportRepo.findOne({ where: { id, universityId } });
    if (!report) throw new NotFoundException('Report not found');
    report.status = ReportStatus.DISMISSED;
    report.resolution = reason;
    report.timeline = [...report.timeline, {
      action: 'dismissed',
      performedBy: report.assignedTo || 'system',
      timestamp: new Date(),
      notes: reason,
    }];
    return this.reportRepo.save(report);
  }

  async getReportStats(universityId: string): Promise<{
    totalReports: number;
    pendingReports: number;
    resolvedReports: number;
    categoryBreakdown: Record<string, number>;
  }> {
    const reports = await this.reportRepo.find({ where: { universityId } });
    return {
      totalReports: reports.length,
      pendingReports: reports.filter((r) => r.status === ReportStatus.PENDING).length,
      resolvedReports: reports.filter((r) => r.status === ReportStatus.RESOLVED).length,
      categoryBreakdown: reports.reduce((acc, r) => ({
        ...acc,
        [r.category]: (acc[r.category] || 0) + 1,
      }), {} as Record<string, number>),
    };
  }

  async detectFraud(universityId: string, targetType: string, targetId: string): Promise<{
    isSuspicious: boolean;
    fraudScore: number;
    reasons: string[];
  }> {
    const reports = await this.reportRepo.find({
      where: { universityId, targetType: targetType as any, targetId },
    });

    const score = Math.min(100, reports.length * 20 + Math.random() * 10);
    return {
      isSuspicious: score > 50,
      fraudScore: score,
      reasons: reports.length > 0
        ? [`${reports.length} reports filed against this item`]
        : ['No reports filed'],
    };
  }

  private calculateInitialFraudScore(category: ReportCategory): number {
    switch (category) {
      case ReportCategory.FRAUD: return 70;
      case ReportCategory.SAFETY_CONCERN: return 60;
      case ReportCategory.HARASSMENT: return 55;
      case ReportCategory.FAKE_LISTING: return 50;
      case ReportCategory.SPAM: return 30;
      default: return 20;
    }
  }
}
