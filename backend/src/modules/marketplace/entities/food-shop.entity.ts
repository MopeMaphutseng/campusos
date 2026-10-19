import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum ShopType {
  INCAMP = 'incamp',
  OFFCAMP = 'offcamp',
}

export enum ShopStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  TEMPORARILY_CLOSED = 'temporarily_closed',
}

@Entity('food_shops')
@Index(['universityId', 'type'])
@Index(['universityId', 'status'])
export class FoodShop extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ShopType })
  type: ShopType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'contact_phone' })
  contactPhone: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  images: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  menu: { name: string; price: number; description?: string }[];

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0, name: 'review_count' })
  reviewCount: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'opening_hours' })
  openingHours: string;

  @Column({ type: 'enum', enum: ShopStatus, default: ShopStatus.ACTIVE })
  status: ShopStatus;

  @Column({ type: 'boolean', default: false, name: 'delivery_available' })
  deliveryAvailable: boolean;

  @Column({ type: 'int', default: 0, name: 'delivery_fee' })
  deliveryFee: number;
}
