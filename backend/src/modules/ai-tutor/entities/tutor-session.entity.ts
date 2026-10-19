import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum TutorMode {
  STUDY = 'study',
  EXAM = 'exam',
  EXPLAIN = 'explain',
  FLASHCARDS = 'flashcards',
  QUIZ = 'quiz',
}

export enum IntegrityMode {
  STRICT = 'strict',
  NORMAL = 'normal',
  OPEN = 'open',
}

@Entity('ai_tutor_sessions')
@Index(['universityId', 'userId'])
@Index(['universityId', 'courseId'])
export class TutorSession extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', nullable: true, name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'course_code' })
  courseCode: string;

  @Column({ type: 'enum', enum: TutorMode, default: TutorMode.STUDY })
  mode: TutorMode;

  @Column({ type: 'enum', enum: IntegrityMode, default: IntegrityMode.NORMAL, name: 'integrity_mode' })
  integrityMode: IntegrityMode;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    tokens?: number;
  }>;

  @Column({ type: 'int', default: 0, name: 'total_tokens' })
  totalTokens: number;

  @Column({ type: 'int', default: 0, name: 'message_count' })
  messageCount: number;

  @Column({ type: 'text', nullable: true, name: 'system_prompt' })
  systemPrompt: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  sources: Array<{
    title: string;
    url?: string;
    relevance: number;
  }>;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', nullable: true, name: 'duration_seconds' })
  durationSeconds: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
