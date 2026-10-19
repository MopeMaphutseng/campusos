import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AnalyticsEvent) private analyticsRepo: Repository<AnalyticsEvent>,
  ) {}

  async trackEvent(data: Partial<AnalyticsEvent>): Promise<AnalyticsEvent> {
    const event = this.analyticsRepo.create(data);
    return this.analyticsRepo.save(event);
  }

  async getModuleUsage(universityId: string, period: string): Promise<Record<string, number>> {
    const startDate = this.getStartDate(period);
    const result = await this.analyticsRepo
      .createQueryBuilder('event')
      .select('event.module', 'module')
      .addSelect('COUNT(*)', 'count')
      .where('event.university_id = :universityId', { universityId })
      .andWhere('event.created_at >= :startDate', { startDate })
      .groupBy('event.module')
      .getRawMany();

    return result.reduce((acc, row) => ({ ...acc, [row.module]: parseInt(row.count) }), {});
  }

  async getUserActivity(universityId: string, period: string): Promise<any> {
    const startDate = this.getStartDate(period);
    const result = await this.analyticsRepo
      .createQueryBuilder('event')
      .select("DATE_TRUNC('day', event.created_at)", 'date')
      .addSelect('COUNT(DISTINCT event.user_id)', 'activeUsers')
      .where('event.university_id = :universityId', { universityId })
      .andWhere('event.created_at >= :startDate', { startDate })
      .groupBy("DATE_TRUNC('day', event.created_at)")
      .orderBy("DATE_TRUNC('day', event.created_at)", 'ASC')
      .getRawMany();

    return result.map((row) => ({
      date: row.date,
      activeUsers: parseInt(row.activeUsers),
    }));
  }

  async getGrowthMetrics(universityId: string): Promise<{
    totalUsers: number;
    newUsersThisMonth: number;
    activeModules: number;
    totalEvents: number;
  }> {
    const totalUsers = await this.analyticsRepo
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.user_id)', 'count')
      .where('event.university_id = :universityId', { universityId })
      .getRawOne();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsers = await this.analyticsRepo
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.user_id)', 'count')
      .where('event.university_id = :universityId', { universityId })
      .andWhere('event.created_at >= :startDate', { startDate: startOfMonth })
      .getRawOne();

    const modules = await this.analyticsRepo
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.module)', 'count')
      .where('event.university_id = :universityId', { universityId })
      .getRawOne();

    const totalEvents = await this.analyticsRepo
      .createQueryBuilder('event')
      .select('COUNT(*)', 'count')
      .where('event.university_id = :universityId', { universityId })
      .getRawOne();

    return {
      totalUsers: parseInt(totalUsers?.count || '0'),
      newUsersThisMonth: parseInt(newUsers?.count || '0'),
      activeModules: parseInt(modules?.count || '0'),
      totalEvents: parseInt(totalEvents?.count || '0'),
    };
  }

  async getReport(universityId: string, reportType: string, query: PaginationDto): Promise<any> {
    const startDate = this.getStartDate(query.search || 'month');

    switch (reportType) {
      case 'engagement':
        return this.getEngagementReport(universityId, startDate, query);
      case 'attendance':
        return this.getAttendanceReport(universityId, startDate, query);
      case 'module-usage':
        return this.getModuleUsageReport(universityId, startDate, query);
      default:
        return this.getEngagementReport(universityId, startDate, query);
    }
  }

  private async getEngagementReport(universityId: string, startDate: Date, query: PaginationDto) {
    const events = await this.analyticsRepo
      .createQueryBuilder('event')
      .select('event.event_type', 'eventType')
      .addSelect('event.module', 'module')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COUNT(DISTINCT event.user_id)', 'uniqueUsers')
      .where('event.university_id = :universityId', { universityId })
      .andWhere('event.created_at >= :startDate', { startDate })
      .groupBy('event.event_type')
      .addGroupBy('event.module')
      .orderBy('count', 'DESC')
      .getRawMany();

    const totalEvents = events.reduce((sum, e) => sum + parseInt(e.count), 0);
    const totalUniqueUsers = new Set(events.map((e) => e.uniqueUsers)).size;

    return {
      type: 'engagement',
      generatedAt: new Date(),
      period: { startDate, endDate: new Date() },
      summary: {
        totalEvents,
        totalUniqueUsers,
        avgEventsPerUser: totalUniqueUsers > 0 ? Math.round(totalEvents / totalUniqueUsers) : 0,
      },
      breakdown: events.map((e) => ({
        eventType: e.eventType,
        module: e.module,
        count: parseInt(e.count),
        uniqueUsers: parseInt(e.uniqueUsers),
      })),
    };
  }

  private async getAttendanceReport(universityId: string, startDate: Date, query: PaginationDto) {
    const dailyActive = await this.analyticsRepo
      .createQueryBuilder('event')
      .select("DATE_TRUNC('day', event.created_at)", 'date')
      .addSelect('COUNT(DISTINCT event.user_id)', 'activeUsers')
      .addSelect('COUNT(*)', 'totalEvents')
      .where('event.university_id = :universityId', { universityId })
      .andWhere('event.created_at >= :startDate', { startDate })
      .groupBy("DATE_TRUNC('day', event.created_at)")
      .orderBy("DATE_TRUNC('day', event.created_at)", 'ASC')
      .getRawMany();

    const peakDay = dailyActive.reduce(
      (max, d) => (parseInt(d.activeUsers) > parseInt(max.activeUsers) ? d : max),
      dailyActive[0] || { date: null, activeUsers: '0' },
    );

    return {
      type: 'attendance',
      generatedAt: new Date(),
      period: { startDate, endDate: new Date() },
      summary: {
        totalDays: dailyActive.length,
        peakActiveUsers: peakDay ? parseInt(peakDay.activeUsers) : 0,
        peakDate: peakDay?.date || null,
        averageDailyActiveUsers: dailyActive.length > 0
          ? Math.round(dailyActive.reduce((sum, d) => sum + parseInt(d.activeUsers), 0) / dailyActive.length)
          : 0,
      },
      dailyBreakdown: dailyActive.map((d) => ({
        date: d.date,
        activeUsers: parseInt(d.activeUsers),
        totalEvents: parseInt(d.totalEvents),
      })),
    };
  }

  private async getModuleUsageReport(universityId: string, startDate: Date, query: PaginationDto) {
    const moduleStats = await this.analyticsRepo
      .createQueryBuilder('event')
      .select('event.module', 'module')
      .addSelect('COUNT(*)', 'totalCalls')
      .addSelect('COUNT(DISTINCT event.user_id)', 'uniqueUsers')
      .addSelect('AVG(event.duration_ms)', 'avgDuration')
      .addSelect('MIN(event.created_at)', 'firstUsed')
      .addSelect('MAX(event.created_at)', 'lastUsed')
      .where('event.university_id = :universityId', { universityId })
      .andWhere('event.created_at >= :startDate', { startDate })
      .groupBy('event.module')
      .orderBy('totalCalls', 'DESC')
      .getRawMany();

    const totalCalls = moduleStats.reduce((sum, m) => sum + parseInt(m.totalCalls), 0);

    return {
      type: 'module-usage',
      generatedAt: new Date(),
      period: { startDate, endDate: new Date() },
      summary: {
        totalModules: moduleStats.length,
        totalCalls,
      },
      modules: moduleStats.map((m) => ({
        module: m.module,
        totalCalls: parseInt(m.totalCalls),
        uniqueUsers: parseInt(m.uniqueUsers),
        avgDuration: m.avgDuration ? Math.round(parseFloat(m.avgDuration)) : null,
        sharePercent: totalCalls > 0 ? Math.round((parseInt(m.totalCalls) / totalCalls) * 10000) / 100 : 0,
        firstUsed: m.firstUsed,
        lastUsed: m.lastUsed,
      })),
    };
  }

  async exportData(universityId: string, module: string, format: string): Promise<{ downloadUrl: string; expiresAt: Date; dataUrl: string }> {
    const startDate = this.getStartDate('month');

    const rows = await this.analyticsRepo
      .createQueryBuilder('event')
      .select([
        'event.event_type',
        'event.module',
        'event.action',
        'event.user_id',
        'event.platform',
        'event.device_type',
        'event.duration_ms',
        'event.created_at',
      ])
      .where('event.university_id = :universityId', { universityId })
      .andWhere('event.module = :module', { module })
      .andWhere('event.created_at >= :startDate', { startDate })
      .orderBy('event.created_at', 'DESC')
      .getMany();

    if (format === 'json') {
      const jsonStr = JSON.stringify(rows, null, 2);
      const dataUrl = `data:application/json;base64,${Buffer.from(jsonStr).toString('base64')}`;
      return {
        downloadUrl: `/api/admin/exports/${universityId}/${module}.json`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        dataUrl,
      };
    }

    const csvHeader = 'eventType,module,action,userId,platform,deviceType,durationMs,createdAt';
    const csvRows = rows.map((r) =>
      [
        r.eventType,
        r.module,
        r.action || '',
        r.userId,
        r.platform || '',
        r.deviceType || '',
        r.durationMs ?? '',
        r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      ].join(','),
    );
    const csvStr = [csvHeader, ...csvRows].join('\n');
    const dataUrl = `data:text/csv;base64,${Buffer.from(csvStr).toString('base64')}`;

    return {
      downloadUrl: `/api/admin/exports/${universityId}/${module}.csv`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      dataUrl,
    };
  }

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'day': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
