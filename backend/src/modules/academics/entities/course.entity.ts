import { Entity, Column, Index, OneToMany } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('courses')
@Index(['universityId', 'code'], { unique: true })
export class Course extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 3 })
  credits: number;

  @Column({ type: 'varchar', length: 100 })
  department: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  faculty: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  level: string;

  @Column({ type: 'int', default: 0, name: 'enrolled_count' })
  enrolledCount: number;

  @Column({ type: 'int', default: 60, name: 'max_capacity' })
  maxCapacity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  semester: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'academic_year' })
  academicYear: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'instructor_id' })
  instructorId: string;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status: CourseStatus;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  prerequisites: string[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;

  @OneToMany('Enrollment', 'course')
  enrollments: any[];
}
