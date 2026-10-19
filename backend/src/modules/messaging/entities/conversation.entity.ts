import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel',
}

@Entity('conversations')
@Index(['universityId', 'type'])
export class Conversation extends TenantBaseEntity {
  @Column({ type: 'enum', enum: ConversationType, default: ConversationType.DIRECT })
  type: ConversationType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'participant_ids' })
  participantIds: string[];

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @Column({ type: 'text', nullable: true, name: 'last_message_preview' })
  lastMessagePreview: string;

  @Column({ type: 'timestamp', nullable: true, name: 'last_message_at' })
  lastMessageAt: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
