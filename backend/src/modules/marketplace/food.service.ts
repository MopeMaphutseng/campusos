import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoodShop, ShopType } from './entities/food-shop.entity';

@Injectable()
export class FoodService {
  constructor(
    @InjectRepository(FoodShop) private foodShopRepo: Repository<FoodShop>,
  ) {}

  async findAll(universityId: string, type?: ShopType): Promise<FoodShop[]> {
    const where: any = { universityId, status: 'active' };
    if (type) where.type = type;
    return this.foodShopRepo.find({ where, order: { rating: 'DESC' } });
  }

  async findById(universityId: string, id: string): Promise<FoodShop> {
    const shop = await this.foodShopRepo.findOne({ where: { id, universityId } });
    if (!shop) throw new NotFoundException('Food shop not found');
    return shop;
  }
}
