import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

@Entity('print_services')
@Index(['universityId', 'isActive'])
export class PrintService extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255, name: 'shop_name' })
  shopName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  building: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  services: Array<{
    name: string;
    price: number;
    colorOptions: string[];
  }>;

  @Column({ type: 'jsonb', default: () => "'{}'", name: 'operating_hours' })
  operatingHours: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'contact_phone' })
  contactPhone: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'estimated_wait_time' })
  estimatedWaitTime: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;
}
