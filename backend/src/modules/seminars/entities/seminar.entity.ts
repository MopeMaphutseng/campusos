import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum SeminarType {
  SEMINAR = 'seminar',
  WORKSHOP = 'workshop',
  COMPETITION = 'competition',
  CONFERENCE = 'conference',
  HACKATHON = 'hackathon',
}

export enum SeminarStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

@Entity('seminars')
@Index(['universityId', 'status'])
@Index(['universityId', 'type'])
@Index(['universityId', 'deadline'])
export class Seminar extends TenantBaseEntity {
  @Column({ length: 255 })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'enum', enum: SeminarType, default: SeminarType.SEMINAR })
  type: SeminarType;

  @Column({
    type: 'enum',
    enum: SeminarStatus,
    default: SeminarStatus.DRAFT,
  })
  status: SeminarStatus;

  @Column({ length: 100, nullable: true })
  location: string;

  @Column({ type: 'boolean', default: false })
  isOnline: boolean;

  @Column({ length: 255, nullable: true })
  onlineUrl: string;

  @Column({ type: 'timestamptz', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deadline: Date;

  @Column({ length: 255, nullable: true })
  organizerName: string;

  @Column({ length: 255, nullable: true })
  organizerEmail: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee: number;

  @Column({ length: 10, default: 'LSL' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  maxParticipants: number;

  @Column({ type: 'int', default: 0 })
  currentParticipants: number;

  @Column('jsonb', { default: [] })
  tags: string[];

  @Column('jsonb', { default: [] })
  speakers: { name: string; title: string; avatarUrl?: string }[];

  @Column('jsonb', { default: '[]' })
  prizes: { position: string; amount: number; description?: string }[];

  @Column('text', { nullable: true })
  imageUrl: string;

  @Column('boolean', { default: false })
  isFeatured: boolean;

  @Column({ type: 'int', default: 0 })
  viewCount: number;
}
