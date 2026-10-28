import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseStatus } from './entities/course.entity';
import { TimetableEntry, DayOfWeek } from './entities/timetable.entity';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { GradeItem } from './entities/grade-item.entity';
import { CourseMaterial, MaterialCategory } from './entities/course-material.entity';
import { GpaCalculatorService, GpaSummary } from './services/gpa-calculator.service';
import { PaginationDto, PaginatedResult, SortOrder } from '../../common/dto/pagination.dto';

@Injectable()
export class AcademicsService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(TimetableEntry) private timetableRepo: Repository<TimetableEntry>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(GradeItem) private gradeItemRepo: Repository<GradeItem>,
    @InjectRepository(CourseMaterial) private materialRepo: Repository<CourseMaterial>,
    private gpaCalculator: GpaCalculatorService,
  ) {}

  async createCourse(universityId: string, data: Partial<Course>): Promise<Course> {
    const course = this.courseRepo.create({ ...data, universityId });
    return this.courseRepo.save(course);
  }

  async findCourses(universityId: string, query: PaginationDto): Promise<PaginatedResult<Course>> {
    const qb = this.courseRepo.createQueryBuilder('course')
      .where('course.universityId = :universityId', { universityId });

    if (query.search) {
      qb.andWhere('(course.name ILIKE :search OR course.code ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || SortOrder.DESC;

    const [items, total] = await qb
      .orderBy('course.' + sortBy, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, page, limit);
  }

  async findCourseById(universityId: string, id: string): Promise<Course> {
    const course = await this.courseRepo.findOne({ where: { id, universityId } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async updateCourse(universityId: string, id: string, data: Partial<Course>): Promise<Course> {
    const course = await this.findCourseById(universityId, id);
    Object.assign(course, data);
    return this.courseRepo.save(course);
  }

  async deleteCourse(universityId: string, id: string): Promise<void> {
    const course = await this.findCourseById(universityId, id);
    await this.courseRepo.softRemove(course);
  }

  async getTimetable(universityId: string, userId?: string, day?: DayOfWeek): Promise<TimetableEntry[]> {
    if (userId) {
      const enrollments = await this.enrollmentRepo.find({
        where: { universityId, userId, status: EnrollmentStatus.ENROLLED },
      });
      const courseIds = enrollments.map((e) => e.courseId).filter(Boolean);
      if (courseIds.length === 0) {
        return [];
      }
      const qb = this.timetableRepo.createQueryBuilder('t')
        .where('t.universityId = :universityId', { universityId })
        .andWhere('t.courseId IN (:...courseIds)', { courseIds });
      if (day) {
        qb.andWhere('t.dayOfWeek = :day', { day });
      }
      return qb.orderBy('t.startTime', 'ASC').getMany();
    }
    const where: any = { universityId };
    if (day) where.dayOfWeek = day;
    return this.timetableRepo.find({ where, order: { startTime: 'ASC' } });
  }

  async addTimetableEntry(universityId: string, data: Partial<TimetableEntry>): Promise<TimetableEntry> {
    const entry = this.timetableRepo.create({ ...data, universityId });
    return this.timetableRepo.save(entry);
  }

  async updateTimetableEntry(universityId: string, id: string, data: Partial<TimetableEntry>): Promise<TimetableEntry> {
    const entry = await this.timetableRepo.findOne({ where: { id, universityId } });
    if (!entry) throw new NotFoundException('Timetable entry not found');
    Object.assign(entry, data);
    return this.timetableRepo.save(entry);
  }

  async deleteTimetableEntry(universityId: string, id: string): Promise<void> {
    const entry = await this.timetableRepo.findOne({ where: { id, universityId } });
    if (!entry) throw new NotFoundException('Timetable entry not found');
    await this.timetableRepo.softRemove(entry);
  }

  async enroll(universityId: string, userId: string, courseId: string, section?: string): Promise<Enrollment> {
    const existing = await this.enrollmentRepo.findOne({
      where: { universityId, userId, courseId },
    });
    if (existing) throw new Error('Already enrolled');

    const course = await this.findCourseById(universityId, courseId);
    if (course.enrolledCount >= course.maxCapacity) throw new Error('Course is full');

    const enrollment = this.enrollmentRepo.create({
      universityId,
      userId,
      courseId,
      section,
      status: EnrollmentStatus.ENROLLED,
      enrolledAt: new Date(),
    });

    course.enrolledCount += 1;
    await this.courseRepo.save(course);

    return this.enrollmentRepo.save(enrollment);
  }

  async dropEnrollment(universityId: string, userId: string, courseId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { universityId, userId, courseId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    enrollment.status = EnrollmentStatus.DROPPED;
    enrollment.droppedAt = new Date();

    const course = await this.findCourseById(universityId, courseId);
    course.enrolledCount = Math.max(0, course.enrolledCount - 1);
    await this.courseRepo.save(course);

    return this.enrollmentRepo.save(enrollment);
  }

  async getMyMaterials(
    universityId: string,
    userId: string,
    options: { courseId?: string; category?: string; search?: string } = {},
  ): Promise<CourseMaterial[]> {
    const enrollments = await this.enrollmentRepo.find({
      where: { universityId, userId, status: EnrollmentStatus.ENROLLED },
    });
    const importedCourses = await this.courseRepo
      .createQueryBuilder('course')
      .select('course.id', 'id')
      .where('course.universityId = :universityId', { universityId })
      .andWhere('course.deletedAt IS NULL')
      .andWhere("course.metadata->>'source' = :source", { source: 'first semester archive' })
      .getRawMany<{ id: string }>();
    const courseIds = Array.from(
      new Set([
        ...enrollments.map((e) => e.courseId).filter(Boolean),
        ...importedCourses.map((course) => course.id),
      ]),
    );
    if (courseIds.length === 0) return [];
    if (options.courseId && !courseIds.includes(options.courseId)) return [];

    const qb = this.materialRepo.createQueryBuilder('m')
      .leftJoinAndSelect('m.course', 'course')
      .where('m.universityId = :universityId', { universityId })
      .andWhere('m.courseId IN (:...courseIds)', { courseIds });

    if (options.courseId) {
      qb.andWhere('m.courseId = :courseId', { courseId: options.courseId });
    }
    if (options.category) {
      qb.andWhere('m.category = :category', { category: options.category });
    }
    if (options.search) {
      qb.andWhere(
        '(m.title ILIKE :search OR m.fileName ILIKE :search OR m.courseCode ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    return qb
      .orderBy('m.courseCode', 'ASC')
      .addOrderBy('m.category', 'ASC')
      .addOrderBy('m.title', 'ASC')
      .getMany();
  }

  async getCourseMaterials(universityId: string, courseId: string): Promise<CourseMaterial[]> {
    return this.materialRepo.find({
      where: { universityId, courseId },
      relations: ['course'],
      order: { category: 'ASC', title: 'ASC' },
    });
  }

  async createMaterial(
    universityId: string,
    userId: string,
    data: Partial<CourseMaterial>,
  ): Promise<CourseMaterial> {
    const material = this.materialRepo.create({
      ...data,
      universityId,
      uploadedBy: data.uploadedBy || userId,
      category: data.category || MaterialCategory.OTHER,
    });
    return this.materialRepo.save(material);
  }

  async recordMaterialDownload(universityId: string, id: string): Promise<CourseMaterial> {
    const material = await this.materialRepo.findOne({ where: { id, universityId } });
    if (!material) throw new NotFoundException('Material not found');
    material.downloadCount += 1;
    return this.materialRepo.save(material);
  }

  async getUserEnrollments(universityId: string, userId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      where: { universityId, userId },
      relations: ['course'],
    });
  }

  async getCourseEnrollments(universityId: string, courseId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      where: { universityId, courseId },
    });
  }

  async getPerformanceSummary(universityId: string, userId: string): Promise<GpaSummary> {
    const enrollments = await this.enrollmentRepo.find({
      where: { universityId, userId },
      relations: ['course'],
    });
    return this.gpaCalculator.calculate(enrollments);
  }

  async getGradeItems(universityId: string, enrollmentId: string): Promise<GradeItem[]> {
    return this.gradeItemRepo.find({
      where: { universityId, enrollmentId },
      order: { gradedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async addGradeItem(
    universityId: string,
    data: Partial<GradeItem>,
  ): Promise<GradeItem> {
    const item = this.gradeItemRepo.create({ ...data, universityId });
    return this.gradeItemRepo.save(item);
  }

  async updateGradeItem(
    universityId: string,
    id: string,
    data: Partial<GradeItem>,
  ): Promise<GradeItem> {
    const item = await this.gradeItemRepo.findOne({ where: { id, universityId } });
    if (!item) throw new NotFoundException('Grade item not found');
    Object.assign(item, data);
    return this.gradeItemRepo.save(item);
  }

  async deleteGradeItem(universityId: string, id: string): Promise<void> {
    const item = await this.gradeItemRepo.findOne({ where: { id, universityId } });
    if (!item) throw new NotFoundException('Grade item not found');
    await this.gradeItemRepo.softRemove(item);
  }
}
