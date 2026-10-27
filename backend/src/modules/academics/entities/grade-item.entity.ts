import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum GradeItemCategory {
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  PRACTICAL = 'practical',
  MIDTERM = 'midterm',
  FINAL = 'final',
  PROJECT = 'project',
  OTHER = 'other',
}

@Entity('grade_items')
@Index(['universityId', 'enrollmentId'])
@Index(['universityId', 'courseId'])
export class GradeItem extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({ type: 'uuid', name: 'enrollment_id' })
  enrollmentId: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({
    type: 'enum',
    enum: GradeItemCategory,
    default: GradeItemCategory.ASSIGNMENT,
  })
  category: GradeItemCategory;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'max_score', default: 100 })
  maxScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  weight: number;

  @Column({ type: 'timestamptz', name: 'graded_at', nullable: true })
  gradedAt: Date;

  @ManyToOne('Enrollment')
  @JoinColumn({ name: 'enrollment_id', referencedColumnName: 'id' })
  enrollment: any;
}
