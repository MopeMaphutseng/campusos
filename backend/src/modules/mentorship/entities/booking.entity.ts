import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('mentorship_bookings')
@Index(['universityId', 'mentorId'])
@Index(['universityId', 'menteeId'])
@Index(['universityId', 'status'])
export class Booking extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'mentor_id' })
  mentorId: string;

  @Column({ type: 'uuid', name: 'mentee_id' })
  menteeId: string;

  @Column({ type: 'timestamp', name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({ type: 'int', default: 60, name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'meeting_type' })
  meetingType: string;

  @Column({ type: 'text', nullable: true, name: 'meeting_link' })
  meetingLink: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  topic: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true, name: 'cancel_reason' })
  cancelReason: string;

  @Column({ type: 'int', nullable: true, name: 'mentee_rating' })
  menteeRating: number;

  @Column({ type: 'text', nullable: true, name: 'mentee_feedback' })
  menteeFeedback: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
