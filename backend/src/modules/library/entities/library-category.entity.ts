import { Entity, Column, OneToMany } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

@Entity('library_categories')
export class LibraryCategory extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parentId: string;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string;

  @Column({ type: 'int', default: 0, name: 'item_count' })
  itemCount: number;

  @OneToMany('LibraryItem', 'category')
  items: any[];
}
