import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
  AUDIO = 'audio',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  DELETED = 'deleted',
}

@Entity('messages')
@Index(['universityId', 'conversationId'])
@Index(['universityId', 'senderId'])
@Index(['universityId', 'conversationId', 'createdAt'])
export class Message extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId: string;

  @Column({ type: 'uuid', name: 'sender_id' })
  senderId: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @Column({ type: 'text', nullable: true, name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'file_name' })
  fileName: string;

  @Column({ type: 'int', nullable: true, name: 'file_size' })
  fileSize: number;

  @Column({ type: 'uuid', nullable: true, name: 'reply_to_id' })
  replyToId: string;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'read_by' })
  readBy: Array<{ userId: string; readAt: Date }>;

  @Column({ type: 'boolean', default: false, name: 'is_edited' })
  isEdited: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'edited_at' })
  editedAt: Date;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
