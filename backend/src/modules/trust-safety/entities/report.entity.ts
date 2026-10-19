import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum ReportCategory {
  SPAM = 'spam',
  FRAUD = 'fraud',
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  FAKE_LISTING = 'fake_listing',
  SAFETY_CONCERN = 'safety_concern',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
  ESCALATED = 'escalated',
}

export enum ReportTargetType {
  USER = 'user',
  LISTING = 'listing',
  MESSAGE = 'message',
  REVIEW = 'review',
  PROJECT = 'project',
  CONTENT = 'content',
}

@Entity('reports')
@Index(['universityId', 'status'])
@Index(['universityId', 'reporterId'])
@Index(['universityId', 'targetType', 'targetId'])
export class Report extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'reporter_id' })
  reporterId: string;

  @Column({ type: 'enum', enum: ReportTargetType, name: 'target_type' })
  targetType: ReportTargetType;

  @Column({ type: 'uuid', name: 'target_id' })
  targetId: string;

  @Column({ type: 'enum', enum: ReportCategory })
  category: ReportCategory;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true, name: 'evidence_urls' })
  evidenceUrls: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_to' })
  assignedTo: string;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  timeline: Array<{
    action: string;
    performedBy: string;
    timestamp: Date;
    notes?: string;
  }>;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'fraud_score' })
  fraudScore: number;

  @Column({ type: 'boolean', default: false, name: 'is_auto_detected' })
  isAutoDetected: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
