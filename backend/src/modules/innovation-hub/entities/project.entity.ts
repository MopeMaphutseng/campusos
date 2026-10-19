import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum ProjectStatus {
  IDEA = 'idea',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  ABANDONED = 'abandoned',
}

export enum ProjectVisibility {
  PUBLIC = 'public',
  UNIVERSITY_ONLY = 'university_only',
  TEAM_ONLY = 'team_only',
}

@Entity('innovation_projects')
@Index(['universityId', 'status'])
@Index(['universityId', 'leadId'])
export class InnovationProject extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'lead_id' })
  leadId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true, name: 'long_description' })
  longDescription: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.IDEA })
  status: ProjectStatus;

  @Column({ type: 'enum', enum: ProjectVisibility, default: ProjectVisibility.PUBLIC })
  visibility: ProjectVisibility;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'team_members' })
  teamMembers: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  @Column({ type: 'text', nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'media_urls' })
  mediaUrls: string[];

  @Column({ type: 'text', nullable: true, name: 'repository_url' })
  repositoryUrl: string;

  @Column({ type: 'text', nullable: true, name: 'demo_url' })
  demoUrl: string;

  @Column({ type: 'int', default: 0, name: 'star_count' })
  starCount: number;

  @Column({ type: 'int', default: 0, name: 'fork_count' })
  forkCount: number;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_featured' })
  isFeatured: boolean;

  @Column({ type: 'int', default: 0, name: 'open_roles' })
  openRoles: number;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'looking_for' })
  lookingFor: string[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
