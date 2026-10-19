import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum StartupStage {
  IDEA = 'idea',
  MVP = 'mvp',
  GROWTH = 'growth',
  ESTABLISHED = 'established',
}

@Entity('startup_hub_entries')
@Index(['universityId', 'stage'])
@Index(['universityId', 'category'])
export class StartupHubEntry extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'uuid', name: 'founder_id' })
  founderId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'founder_name' })
  founderName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'enum', enum: StartupStage, default: StartupStage.IDEA })
  stage: StartupStage;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'funding_amount' })
  fundingAmount: number;

  @Column({ type: 'int', default: 1, name: 'team_size' })
  teamSize: number;

  @Column({ type: 'text', nullable: true, name: 'website_url' })
  websiteUrl: string;

  @Column({ type: 'text', nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ type: 'boolean', default: false, name: 'is_featured' })
  isFeatured: boolean;
}
