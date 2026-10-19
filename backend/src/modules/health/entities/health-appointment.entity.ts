import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum HealthAppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum HealthAppointmentType {
  CONSULTATION = 'consultation',
  CHECKUP = 'checkup',
  VACCINATION = 'vaccination',
  COUNSELING = 'counseling',
  EMERGENCY = 'emergency',
}

@Entity('health_appointments')
@Index(['universityId', 'userId'])
@Index(['universityId', 'providerId'])
@Index(['universityId', 'status'])
@Index(['universityId', 'scheduledAt'])
export class HealthAppointment extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', nullable: true, name: 'provider_id' })
  providerId: string;

  @Column({ type: 'enum', enum: HealthAppointmentType })
  type: HealthAppointmentType;

  @Column({
    type: 'enum',
    enum: HealthAppointmentStatus,
    default: HealthAppointmentStatus.PENDING,
  })
  status: HealthAppointmentStatus;

  @Column({ type: 'timestamp', name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({ type: 'int', default: 30, name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  symptoms: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  priority: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
