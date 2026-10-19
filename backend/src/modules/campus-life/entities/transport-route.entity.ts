import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

@Entity('transport_routes')
@Index(['universityId', 'isActive'])
export class TransportRoute extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255, name: 'route_name' })
  routeName: string;

  @Column({ type: 'varchar', length: 50, name: 'route_number' })
  routeNumber: string;

  @Column({ type: 'varchar', length: 255, name: 'start_location' })
  startLocation: string;

  @Column({ type: 'varchar', length: 255, name: 'end_location' })
  endLocation: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  stops: Array<{ name: string; lat: number; lng: number; order: number }>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  schedule: {
    weekdays?: string[];
    weekends?: string[];
    holidays?: string[];
  };

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'vehicle_type' })
  vehicleType: string;

  @Column({ type: 'int', default: 0 })
  capacity: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  fare: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, name: 'current_lat' })
  currentLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, name: 'current_lng' })
  currentLng: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_updated' })
  lastUpdated: Date;
}
