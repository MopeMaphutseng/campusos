import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

@Entity('alumni_profiles')
@Index(['universityId', 'userId'], { unique: true })
@Index(['universityId', 'industry'])
@Index(['universityId', 'graduationYear'])
@Index(['universityId', 'isMentor'])
export class AlumniProfile extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'int', name: 'graduation_year' })
  graduationYear: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  faculty: string;

  @Column({ type: 'varchar', length: 255 })
  department: string;

  @Column({ type: 'varchar', length: 255 })
  degree: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'current_company' })
  currentCompany: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'current_position' })
  currentPosition: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  industry: string;

  @Column({ type: 'text', nullable: true, name: 'linkedin_url' })
  linkedinUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  expertise: string[];

  @Column({ type: 'boolean', default: false, name: 'is_mentor' })
  isMentor: boolean;

  @Column({ type: 'boolean', default: false, name: 'available_for_mentoring' })
  availableForMentoring: boolean;

  @Column({ type: 'int', default: 0, name: 'mentorship_capacity' })
  mentorshipCapacity: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0, name: 'total_mentee_sessions' })
  totalMenteeSessions: number;

  @Column({ type: 'int', default: 0, name: 'years_of_experience' })
  yearsOfExperience: number;
}
