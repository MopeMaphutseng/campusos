import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentProvider {
  MPESA = 'mpesa',
  ECOCASH = 'ecocash',
  STRIPE = 'stripe',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CAMPUS_WALLET = 'campus_wallet',
}

export enum TransactionType {
  TUITION = 'tuition',
  HOSTEL = 'hostel',
  LIBRARY_FINE = 'library_fine',
  CAFETERIA = 'cafeteria',
  MARKETPLACE = 'marketplace',
  SCHOLARSHIP = 'scholarship',
  EVENT = 'event',
  OTHER = 'other',
}

@Entity('transactions')
@Index(['universityId', 'userId'])
@Index(['universityId', 'status'])
@Index(['universityId', 'provider'])
@Index(['universityId', 'createdAt'])
export class Transaction extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider: PaymentProvider;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'provider_transaction_id' })
  providerTransactionId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'recipient_id' })
  recipientId: string;

  @Column({ type: 'jsonb', default: () => "'{}'", name: 'provider_metadata' })
  providerMetadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'refunded_at' })
  refundedAt: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'refunded_amount' })
  refundedAmount: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
