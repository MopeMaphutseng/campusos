import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum ReviewStatus {
  ACTIVE = 'active',
  FLAGGED = 'flagged',
  REMOVED = 'removed',
}

@Entity('marketplace_reviews')
@Index(['universityId', 'revieweeId'])
@Index(['universityId', 'listingId'])
export class Review extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'reviewer_id' })
  reviewerId: string;

  @Column({ type: 'uuid', name: 'reviewee_id' })
  revieweeId: string;

  @Column({ type: 'uuid', nullable: true, name: 'listing_id' })
  listingId: string;

  @Column({ type: 'uuid', nullable: true, name: 'transaction_id' })
  transactionId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  tags: string[];

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.ACTIVE,
  })
  status: ReviewStatus;

  @Column({ type: 'boolean', default: false, name: 'is_verified_transaction' })
  isVerifiedTransaction: boolean;
}
