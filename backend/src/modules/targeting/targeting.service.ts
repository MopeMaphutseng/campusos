import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContentTarget } from './entities/content-target.entity';
import { Enrollment } from '../academics/entities/enrollment.entity';

@Injectable()
export class TargetingService {
  private readonly logger = new Logger(TargetingService.name);
  private readonly courseCache = new Map<string, { codes: string[]; at: number }>();

  constructor(
    @InjectRepository(ContentTarget)
    private readonly targets: Repository<ContentTarget>,
    @InjectRepository(Enrollment)
    private readonly enrollments: Repository<Enrollment>,
  ) {}

  /** Course codes the student is currently enrolled in (2-min cache). */
  async getStudentCourseCodes(universityId: string, userId: string): Promise<string[]> {
    if (!userId) return [];
    const key = `${universityId}:${userId}`;
    const cached = this.courseCache.get(key);
    if (cached && Date.now() - cached.at < 2 * 60 * 1000) return cached.codes;

    try {
      const rows = await this.enrollments.find({
        where: { universityId, userId },
        relations: ['course'],
      });
      const codes = Array.from(
        new Set(
          rows
            .map((r) => (r.course?.code as string) || (r as any).courseCode || null)
            .filter((c): c is string => !!c)
            .map((c) => c.toUpperCase()),
        ),
      );
      this.courseCache.set(key, { codes, at: Date.now() });
      return codes;
    } catch (err) {
      this.logger.warn(`Could not resolve course codes for ${userId}: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Filter a list of content items for a student. Items with no targeting row
   * stay visible to everyone; targeted items are visible only when the
   * student's course codes intersect the target.
   */
  async filterVisible<T extends { id: string }>(
    items: T[],
    universityId: string,
    contentType: string,
    courseCodes: string[],
  ): Promise<T[]> {
    if (!Array.isArray(items) || items.length === 0) return items;
    const ids = items.map((i) => i.id).filter(Boolean);
    if (ids.length === 0) return items;

    let rows: ContentTarget[] = [];
    try {
      rows = await this.targets.find({ where: { universityId, contentType, contentId: In(ids) } });
    } catch (err) {
      this.logger.warn(`Targeting lookup failed (${contentType}): ${(err as Error).message}`);
      return items;
    }
    if (rows.length === 0) return items;

    const map = new Map<string, string[]>();
    for (const r of rows) {
      map.set(r.contentId, (r.courseCodes || []).map((c) => c.toUpperCase()));
    }
    const mine = new Set(courseCodes.map((c) => c.toUpperCase()));

    return items.filter((item) => {
      const target = map.get(item.id);
      if (!target || target.length === 0) return true;
      return target.some((code) => mine.has(code));
    });
  }

  /** Upsert a targeting row for a piece of content. Empty codes clears targeting. */
  async setTargeting(
    universityId: string,
    contentType: string,
    contentId: string,
    courseCodes: string[],
  ): Promise<void> {
    const codes = Array.from(new Set((courseCodes || []).map((c) => String(c).trim().toUpperCase()).filter(Boolean)));
    const existing = await this.targets.findOne({ where: { universityId, contentType, contentId } });
    if (codes.length === 0) {
      if (existing) await this.targets.softRemove(existing);
      return;
    }
    if (existing) {
      existing.courseCodes = codes;
      await this.targets.save(existing);
    } else {
      await this.targets.save(this.targets.create({ universityId, contentType, contentId, courseCodes: codes }));
    }
  }

  async getTargeting(universityId: string, contentType: string, contentId: string): Promise<string[]> {
    const row = await this.targets.findOne({ where: { universityId, contentType, contentId } });
    return row?.courseCodes || [];
  }
}
