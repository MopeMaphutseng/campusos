import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum MentorStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  PAUSED = 'paused',
}

@Entity('mentor_profiles')
@Index(['universityId', 'userId'], { unique: true })
@Index(['universityId', 'status'])
@Index(['universityId', 'expertise'], { using: 'GIN' })
export class MentorProfile extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  expertise: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  @Column({ type: 'int', default: 0, name: 'total_sessions' })
  totalSessions: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, name: 'average_rating' })
  averageRating: number;

  @Column({ type: 'int', default: 0, name: 'review_count' })
  reviewCount: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  availability: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };

  @Column({
    type: 'enum',
    enum: MentorStatus,
    default: MentorStatus.AVAILABLE,
  })
  status: MentorStatus;

  @Column({ type: 'int', default: 10, name: 'max_mentees' })
  maxMentees: number;

  @Column({ type: 'int', default: 0, name: 'current_mentees' })
  currentMentees: number;

  @Column({ type: 'jsonb', default: () => "'{}'", name: 'social_links' })
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}
