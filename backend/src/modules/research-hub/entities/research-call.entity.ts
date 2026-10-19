import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum ResearchCallStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  FILLED = 'filled',
  EXPIRED = 'expired',
}

export enum ResearchCallType {
  RA_POSITION = 'ra_position',
  THESIS_SUPERVISOR = 'thesis_supervisor',
  COLLABORATION = 'collaboration',
  FUNDING = 'funding',
}

@Entity('research_calls')
@Index(['universityId', 'status'])
@Index(['universityId', 'supervisorId'])
export class ResearchCall extends TenantBaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'supervisor_id' })
  supervisorId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ResearchCallType })
  type: ResearchCallType;

  @Column({ type: 'enum', enum: ResearchCallStatus, default: ResearchCallStatus.OPEN })
  status: ResearchCallStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  field: string;

  @Column({ type: 'int', default: 1, name: 'positions_available' })
  positionsAvailable: number;

  @Column({ type: 'int', default: 0, name: 'current_applications' })
  currentApplications: number;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'stipend_amount' })
  stipendAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'required_skills' })
  requiredSkills: string[];

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'preferred_skills' })
  preferredSkills: string[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  eligibility: {
    minGpa?: number;
    yearOfStudy?: number[];
    programs?: string[];
  };

  @Column({ type: 'boolean', default: false, name: 'is_ai_matched' })
  isAiMatched: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
