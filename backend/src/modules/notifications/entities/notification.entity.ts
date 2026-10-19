import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum NotificationType {
  PUSH = 'push',
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('notifications')
@Index(['universityId', 'userId'])
@Index(['universityId', 'userId', 'readAt'])
@Index(['universityId', 'type'])
export class Notification extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.IN_APP })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  module: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'action_type' })
  actionType: string;

  @Column({ type: 'text', nullable: true, name: 'action_url' })
  actionUrl: string;

  @Column({ type: 'enum', enum: NotificationPriority, default: NotificationPriority.NORMAL })
  priority: NotificationPriority;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  data: Record<string, any>;

  @Column({ type: 'text', nullable: true, name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  readAt: Date;

  @Column({ type: 'boolean', default: false })
  sent: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sentAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'external_id' })
  externalId: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
