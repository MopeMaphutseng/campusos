import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

@Entity('university_modules')
@Index(['universityId', 'moduleKey'], { unique: true })
export class UniversityModule extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 100, name: 'module_key' })
  moduleKey: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  config: Record<string, any>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  limits: {
    maxUsers?: number;
    maxStorageMb?: number;
    rateLimit?: number;
  };

  @ManyToOne('University', 'modules')
  @JoinColumn({ name: 'university_id' })
  university: any;
}
