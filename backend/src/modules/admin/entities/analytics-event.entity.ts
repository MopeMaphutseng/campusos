import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('analytics_events')
@Index(['universityId', 'eventType'])
@Index(['universityId', 'createdAt'])
@Index(['universityId', 'userId'])
export class AnalyticsEvent extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  universityId: string;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 100, name: 'event_type' })
  eventType: string;

  @Column({ type: 'varchar', length: 100 })
  module: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  action: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  properties: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  browser: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'device_type' })
  deviceType: string;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'int', nullable: true, name: 'duration_ms' })
  durationMs: number;
}
