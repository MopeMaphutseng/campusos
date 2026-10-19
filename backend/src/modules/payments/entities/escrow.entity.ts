import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum EscrowStatus {
  HELD = 'held',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
  EXPIRED = 'expired',
}

@Entity('escrow_holdings')
@Index(['universityId', 'transactionId'], { unique: true })
@Index(['universityId', 'status'])
@Index(['universityId', 'buyerId'])
@Index(['universityId', 'sellerId'])
@Index(['universityId', 'expiresAt'])
export class EscrowHolding extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'transaction_id' })
  transactionId: string;

  @Column({ type: 'uuid', name: 'buyer_id' })
  buyerId: string;

  @Column({ type: 'uuid', name: 'seller_id' })
  sellerId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: EscrowStatus,
    default: EscrowStatus.HELD,
  })
  status: EscrowStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'platform_fee' })
  platformFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'seller_payout' })
  sellerPayout: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'release_transaction_id' })
  releaseTransactionId: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'released_at' })
  releasedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'refunded_at' })
  refundedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'dispute_reason' })
  disputeReason: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;
}
