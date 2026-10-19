import { Controller, Get, Param, Query, Headers } from '@nestjs/common';
import { FoodService } from './food.service';
import { ShopType } from './entities/food-shop.entity';

@Controller('marketplace/food')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get('shops')
  async findAll(
    @Headers('X-University-ID') universityId: string,
    @Query('type') type?: ShopType,
  ) {
    return this.foodService.findAll(universityId, type);
  }

  @Get('shops/:id')
  async findById(
    @Headers('X-University-ID') universityId: string,
    @Param('id') id: string,
  ) {
    return this.foodService.findById(universityId, id);
  }
}
