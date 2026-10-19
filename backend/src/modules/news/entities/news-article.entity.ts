import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum NewsCategory {
  CAMPUS = 'campus',
  ACADEMIC = 'academic',
  SPORTS = 'sports',
  EVENTS = 'events',
  ACHIEVEMENTS = 'achievements',
  INTERNATIONAL = 'international',
}

@Entity('news_articles')
@Index(['universityId', 'category'])
@Index(['universityId', 'isPublished'])
@Index(['universityId', 'publishedAt'])
export class NewsArticle extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'uuid', name: 'author_id' })
  authorId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'author_name' })
  authorName: string;

  @Column({ type: 'enum', enum: NewsCategory, default: NewsCategory.CAMPUS })
  category: NewsCategory;

  @Column({ type: 'text', nullable: true, name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  @Column({ type: 'boolean', default: false, name: 'is_published' })
  isPublished: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  publishedAt: Date;

  @Column({ type: 'int', default: 0, name: 'view_count' })
  viewCount: number;
}
