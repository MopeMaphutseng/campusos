import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum ListingCategory {
  TEXTBOOKS = 'textbooks',
  ELECTRONICS = 'electronics',
  FURNITURE = 'furniture',
  SERVICES = 'services',
  TICKETS = 'tickets',
  OTHER = 'other',
}

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  EXPIRED = 'expired',
  REMOVED = 'removed',
}

export enum CurrencyCode {
  USD = 'USD',
  LSL = 'LSL',
  KES = 'KES',
  ZAR = 'ZAR',
  NGN = 'NGN',
  GHS = 'GHS',
  EGP = 'EGP',
  TZS = 'TZS',
  UGX = 'UGX',
}

@Entity('marketplace_listings')
@Index(['universityId', 'category'])
@Index(['universityId', 'status'])
@Index(['universityId', 'sellerId'])
export class Listing extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'seller_id' })
  sellerId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: CurrencyCode, default: CurrencyCode.USD })
  currency: CurrencyCode;

  @Column({ type: 'enum', enum: ListingCategory })
  category: ListingCategory;

  @Column({ type: 'varchar', length: 20, default: 'good' })
  condition: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  images: string[];

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.ACTIVE })
  status: ListingStatus;

  @Column({ type: 'boolean', default: true, name: 'is_negotiable' })
  negotiable: boolean;

  @Column({ type: 'int', default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ type: 'int', default: 0, name: 'bookmark_count' })
  bookmarkCount: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  location: {
    building?: string;
    area?: string;
  };

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
