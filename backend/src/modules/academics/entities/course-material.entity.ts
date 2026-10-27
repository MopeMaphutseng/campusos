import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum MaterialCategory {
  LECTURES = 'lectures',
  LABS = 'labs',
  TUTORIALS = 'tutorials',
  ASSIGNMENTS = 'assignments',
  PAST_PAPERS = 'past_papers',
  NOTES = 'notes',
  PROJECTS = 'projects',
  READINGS = 'readings',
  CODE = 'code',
  IMAGES = 'images',
  COURSE_INFO = 'course_info',
  OTHER = 'other',
}

@Entity('course_materials')
@Index(['universityId', 'courseId'])
@Index(['universityId', 'category'])
export class CourseMaterial extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 20, name: 'course_code' })
  courseCode: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: MaterialCategory.OTHER })
  category: string;

  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  fileName: string;

  @Column({ type: 'text', name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'varchar', length: 120, nullable: true, name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'int', default: 0, name: 'size_bytes' })
  sizeBytes: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum: string;

  @Column({ type: 'uuid', nullable: true, name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ type: 'int', default: 0, name: 'download_count' })
  downloadCount: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;

  @ManyToOne('Course', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id', referencedColumnName: 'id' })
  course: any;
}
