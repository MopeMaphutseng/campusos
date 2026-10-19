import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum EnrollmentStatus {
  PENDING = 'pending',
  ENROLLED = 'enrolled',
  DROPPED = 'dropped',
  COMPLETED = 'completed',
  WAITLISTED = 'waitlisted',
}

@Entity('enrollments')
@Index(['universityId', 'userId', 'courseId'], { unique: true })
@Index(['universityId', 'courseId'])
export class Enrollment extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  section: string;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.PENDING,
  })
  status: EnrollmentStatus;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  grade: number;

  @Column({ type: 'varchar', length: 5, nullable: true, name: 'letter_grade' })
  letterGrade: string;

  @Column({ type: 'timestamp', nullable: true, name: 'enrolled_at' })
  enrolledAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'dropped_at' })
  droppedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;

  @ManyToOne('Course', 'enrollments')
  @JoinColumn({ name: 'course_id', referencedColumnName: 'id' })
  course: any;
}
