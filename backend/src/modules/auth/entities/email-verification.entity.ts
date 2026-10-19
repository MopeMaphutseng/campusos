import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum VerificationPurpose {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

/**
 * One active verification code per (user, purpose). The code itself is never
 * stored — only an HMAC-SHA256 hash keyed by a server secret (see
 * VerificationService). Rows are hard-deleted the moment a code is consumed,
 * expires, or exhausts its attempt budget, so a leaked database cannot be used
 * to verify an account. Adapted from Pula Maliboho `models/email_verification.py`.
 */
@Entity('email_verifications')
@Index(['userId', 'purpose'], { unique: true })
@Index(['universityId', 'email'])
export class EmailVerification extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ type: 'enum', enum: VerificationPurpose, default: VerificationPurpose.EMAIL_VERIFICATION })
  purpose: VerificationPurpose;

  @Column({ type: 'varchar', length: 128, name: 'code_hash' })
  codeHash: string;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', name: 'last_sent_at', nullable: true })
  lastSentAt: Date;
}
