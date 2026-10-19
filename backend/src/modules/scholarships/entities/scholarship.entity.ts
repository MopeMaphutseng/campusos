import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum ScholarshipStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  AWARDED = 'awarded',
  ARCHIVED = 'archived',
}

export enum ScholarshipType {
  MERIT = 'merit',
  NEED_BASED = 'need_based',
  ATHLETIC = 'athletic',
  MINORITY = 'minority',
  RESEARCH = 'research',
  COMMUNITY = 'community',
  OTHER = 'other',
}

@Entity('scholarships')
@Index(['universityId', 'status'])
@Index(['universityId', 'deadline'])
export class Scholarship extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'enum', enum: ScholarshipType })
  type: ScholarshipType;

  @Column({ type: 'enum', enum: ScholarshipStatus, default: ScholarshipStatus.DRAFT })
  status: ScholarshipStatus;

  @Column({ type: 'timestamp' })
  deadline: Date;

  @Column({ type: 'int', default: 1, name: 'available_slots' })
  availableSlots: number;

  @Column({ type: 'int', default: 0, name: 'current_applications' })
  currentApplications: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  eligibility: {
    minGpa?: number;
    yearOfStudy?: number[];
    departments?: string[];
    nationalities?: string[];
    gender?: string;
    otherRequirements?: string[];
  };

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'required_documents' })
  requiredDocuments: string[];

  @Column({ type: 'text', nullable: true, name: 'application_url' })
  applicationUrl: string;

  @Column({ type: 'uuid', nullable: true, name: 'provider_id' })
  providerId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'provider_name' })
  providerName: string;

  @Column({ type: 'boolean', default: false, name: 'is_ai_matched' })
  isAiMatched: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'", name: 'ai_match_score' })
  aiMatchScore: Record<string, any>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
