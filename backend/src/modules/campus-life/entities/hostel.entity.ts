import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum HostelStatus {
  AVAILABLE = 'available',
  FULL = 'full',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed',
}

@Entity('hostels')
@Index(['universityId', 'status'])
export class Hostel extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: HostelStatus, default: HostelStatus.AVAILABLE })
  status: HostelStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gender: string;

  @Column({ type: 'int', default: 0, name: 'total_beds' })
  totalBeds: number;

  @Column({ type: 'int', default: 0, name: 'available_beds' })
  availableBeds: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'price_per_semester' })
  pricePerSemester: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  amenities: string[];

  @Column({ type: 'text', nullable: true, name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  images: string[];

  @Column({ type: 'int', default: 0, name: 'total_rooms' })
  totalRooms: number;

  @Column({ type: 'jsonb', default: () => "'{}'", name: 'room_types' })
  roomTypes: Record<string, { count: number; capacity: number; price: number }>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
