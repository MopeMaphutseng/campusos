import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum MapLocationType {
  ACADEMIC = 'academic',
  RESIDENTIAL = 'residential',
  DINING = 'dining',
  SPORTS = 'sports',
  LIBRARY = 'library',
  ADMIN = 'admin',
  PARKING = 'parking',
  HEALTH = 'health',
  TRANSPORT = 'transport',
  OTHER = 'other',
}

@Entity('campus_map_locations')
@Index(['universityId', 'type'])
export class CampusMapLocation extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: MapLocationType })
  type: MapLocationType;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  building: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  floor: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  room: string;

  @Column({ type: 'text', nullable: true, name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'jsonb', default: () => "'{}'", name: 'opening_hours' })
  openingHours: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };

  @Column({ type: 'jsonb', default: () => "'[]'" })
  amenities: string[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
