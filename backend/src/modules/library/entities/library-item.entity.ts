import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum LibraryItemType {
  TEXTBOOK = 'textbook',
  NOTES = 'notes',
  VIDEO = 'video',
  DOCUMENT = 'document',
  LINK = 'link',
  AI_GENERATED = 'ai_generated',
}

export enum LibraryItemAccess {
  PUBLIC = 'public',
  COURSE_ONLY = 'course_only',
  FACULTY_ONLY = 'faculty_only',
}

@Entity('library_items')
@Index(['universityId', 'courseId'])
@Index(['universityId', 'faculty'])
@Index(['universityId', 'topic'], { where: '"topic" IS NOT NULL' })
export class LibraryItem extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: LibraryItemType })
  type: LibraryItemType;

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  categoryId: string;

  @Column({ type: 'uuid', nullable: true, name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'course_code' })
  courseCode: string;

  @Column({ type: 'varchar', length: 100 })
  faculty: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  topic: string;

  @Column({ type: 'text', nullable: true, name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'text', nullable: true, name: 'external_url' })
  externalUrl: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'uuid', name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ type: 'int', default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ type: 'int', default: 0, name: 'download_count' })
  downloadCount: number;

  @Column({ type: 'int', default: 0 })
  upvotes: number;

  @Column({ type: 'int', default: 0 })
  downvotes: number;

  @Column({
    type: 'enum',
    enum: LibraryItemAccess,
    default: LibraryItemAccess.PUBLIC,
  })
  access: LibraryItemAccess;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'", name: 'ai_summary' })
  aiSummary: {
    summary?: string;
    keyTopics?: string[];
    difficulty?: string;
  };

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;

  @ManyToOne('LibraryCategory', 'items')
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: any;
}
