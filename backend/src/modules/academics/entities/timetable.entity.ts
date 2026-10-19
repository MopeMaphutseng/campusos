import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Entity('timetable_entries')
@Index(['universityId', 'courseId'])
@Index(['universityId', 'dayOfWeek'])
export class TimetableEntry extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 255, name: 'course_name' })
  courseName: string;

  @Column({ type: 'varchar', length: 20, name: 'course_code' })
  courseCode: string;

  @Column({ type: 'enum', enum: DayOfWeek, name: 'day_of_week' })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'varchar', length: 100 })
  venue: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  building: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'instructor_id' })
  instructorId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'instructor_name' })
  instructorName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  section: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
