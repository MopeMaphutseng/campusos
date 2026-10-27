import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

@Entity('cafeteria_menus')
@Index(['universityId', 'date', 'mealType'])
@Index(['universityId', 'shopId'])
export class CafeteriaMenu extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'shop_id', nullable: true })
  shopId: string;

  @Column({ type: 'varchar', length: 255, name: 'shop_name', nullable: true })
  shopName: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: MealType, name: 'meal_type', default: MealType.LUNCH })
  mealType: MealType;

  @Column({ type: 'varchar', length: 150, name: 'item_name' })
  itemName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 10, default: 'LSL' })
  currency: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  category: string;

  @Column({
    type: 'jsonb',
    default: () => "'[]'",
    name: 'dietary_flags',
  })
  dietaryFlags: string[];

  @Column({ type: 'boolean', default: true, name: 'is_available' })
  isAvailable: boolean;
}
