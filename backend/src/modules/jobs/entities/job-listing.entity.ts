import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum JobType {
  INTERNSHIP = 'internship',
  PART_TIME = 'part_time',
  FULL_TIME = 'full_time',
  CONTRACT = 'contract',
  FREELANCE = 'freelance',
  VOLUNTEER = 'volunteer',
}

export enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  EXPIRED = 'expired',
  ARCHIVED = 'archived',
}

@Entity('job_listings')
@Index(['universityId', 'status'])
@Index(['universityId', 'type'])
@Index(['universityId', 'employerId'])
export class JobListing extends TenantBaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'employer_id' })
  employerId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: JobType })
  type: JobType;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status: JobStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string;

  @Column({ type: 'text', nullable: true, name: 'company_logo_url' })
  companyLogoUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

  @Column({ type: 'boolean', default: false, name: 'is_remote' })
  isRemote: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'salary_min' })
  salaryMin: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'salary_max' })
  salaryMax: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  skills: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  requirements: string[];

  @Column({ type: 'int', default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ type: 'int', default: 0, name: 'application_count' })
  applicationCount: number;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
