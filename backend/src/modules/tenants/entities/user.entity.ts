import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum UserRole {
  STUDENT = 'student',
  FACULTY = 'faculty',
  STAFF = 'staff',
  ALUMNI = 'alumni',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  MENTOR = 'mentor',
  EMPLOYER = 'employer',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('users')
@Index(['universityId', 'email'], { unique: true })
@Index(['universityId', 'studentId'], { unique: true, where: '"student_id" IS NOT NULL' })
export class User extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'student_id' })
  studentId: string;

  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.UNVERIFIED,
    name: 'verification_status',
  })
  verificationStatus: VerificationStatus;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'enabled_modules' })
  enabledModules: string[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  preferences: {
    language?: string;
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      push?: boolean;
      email?: boolean;
      sms?: boolean;
    };
    accessibility?: {
      textSize?: 'small' | 'medium' | 'large';
      highContrast?: boolean;
      screenReader?: boolean;
    };
  };

  @Column({ type: 'jsonb', default: () => "'{}'", name: 'academic_profile' })
  academicProfile: {
    faculty?: string;
    department?: string;
    program?: string;
    yearOfStudy?: number;
    enrollmentDate?: string;
    expectedGraduation?: string;
    gpa?: number;
  };

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'phone_country_code' })
  phoneCountryCode: string;

  @Column({ type: 'boolean', default: false, name: 'phone_verified' })
  phoneVerified: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'sensitive_operation_cooldown_until' })
  sensitiveOperationCooldownUntil: Date;

  @Column({ type: 'int', default: 0, name: 'failed_login_attempts' })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true, name: 'locked_until' })
  lockedUntil: Date;

  @ManyToOne('University', 'users')
  @JoinColumn({ name: 'university_id' })
  university: any;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
