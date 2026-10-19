import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum ClubCategory {
  ACADEMIC = 'academic',
  SOCIAL = 'social',
  SPORTS = 'sports',
  CULTURAL = 'cultural',
  RELIGIOUS = 'religious',
  PROFESSIONAL = 'professional',
}

@Entity('clubs')
@Index(['universityId', 'category'])
@Index(['universityId', 'isActive'])
export class Club extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ClubCategory, default: ClubCategory.SOCIAL })
  category: ClubCategory;

  @Column({ type: 'uuid', nullable: true, name: 'president_id' })
  presidentId: string;

  @Column({ type: 'int', default: 0, name: 'member_count' })
  memberCount: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'meeting_schedule' })
  meetingSchedule: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'meeting_location' })
  meetingLocation: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'contact_email' })
  contactEmail: string;

  @Column({ type: 'text', nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;
}
