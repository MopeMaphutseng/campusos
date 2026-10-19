import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseStatus } from './entities/course.entity';
import { TimetableEntry, DayOfWeek } from './entities/timetable.entity';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class AcademicsService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(TimetableEntry) private timetableRepo: Repository<TimetableEntry>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
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
}
