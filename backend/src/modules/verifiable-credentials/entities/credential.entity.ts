import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CredentialType {
  BADGE = 'badge',
  CERTIFICATE = 'certificate',
  TRANSCRIPT = 'transcript',
  ENROLLMENT_PROOF = 'enrollment_proof',
  SKILL = 'skill',
  ACHIEVEMENT = 'achievement',
}

export enum CredentialStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity('verifiable_credentials')
@Index(['universityId', 'holderId'])
@Index(['universityId', 'type'])
@Index(['universityId', 'status'])
export class VerifiableCredential extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  universityId: string;

  @Column({ type: 'uuid', name: 'holder_id' })
  holderId: string;

  @Column({ type: 'enum', enum: CredentialType })
  type: CredentialType;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', name: 'issuance_date' })
  issuanceDate: string;

  @Column({ type: 'text', nullable: true, name: 'expiration_date' })
  expirationDate: string;

  @Column({
    type: 'enum',
    enum: CredentialStatus,
    default: CredentialStatus.ACTIVE,
  })
  status: CredentialStatus;

  @Column({ type: 'text', name: 'credential_subject' })
  credentialSubject: string;

  @Column({ type: 'text', nullable: true })
  proof: string;

  @Column({ type: 'varchar', length: 255, name: 'issuer_did' })
  issuerDid: string;

  @Column({ type: 'text', nullable: true, name: 'holder_did' })
  holderDid: string;

  @Column({ type: 'text', nullable: true, name: 'credential_url' })
  credentialUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'course_code' })
  courseCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  skill: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true, name: 'qr_code_data' })
  qrCodeData: string;

  @Column({ type: 'text', nullable: true, name: 'revoked_at' })
  revokedAt?: string;
}
