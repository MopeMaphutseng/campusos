import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

@Entity('content_targets')
@Index(['universityId', 'contentType', 'contentId'])
export class ContentTarget extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 40, name: 'content_type' })
  contentType: string;

  @Column({ type: 'uuid', name: 'content_id' })
  contentId: string;

  @Column({ type: 'text', array: true, default: () => "'{}'", name: 'course_codes' })
  courseCodes: string[];
}
