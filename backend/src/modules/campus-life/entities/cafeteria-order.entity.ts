import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum CafeteriaOrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('cafeteria_orders')
@Index(['universityId', 'userId'])
@Index(['universityId', 'status'])
export class CafeteriaOrder extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cafeteria_name' })
  cafeteriaName: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  items: Array<{
    menuItemId?: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: CafeteriaOrderStatus,
    default: CafeteriaOrderStatus.PENDING,
  })
  status: CafeteriaOrderStatus;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'pickup_location' })
  pickupLocation: string;

  @Column({ type: 'timestamp', nullable: true, name: 'estimated_ready_at' })
  estimatedReadyAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'special_instructions' })
  specialInstructions: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payment_method' })
  paymentMethod: string;

  @Column({ type: 'boolean', default: false, name: 'is_paid' })
  isPaid: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
