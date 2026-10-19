import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { Listing } from './entities/listing.entity';
import { Review } from './entities/review.entity';
import { FoodShop } from './entities/food-shop.entity';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';

@Module({
  imports: [TypeOrmModule.forFeature([Listing, Review, FoodShop])],
  controllers: [MarketplaceController, FoodController],
  providers: [MarketplaceService, FoodService],
  exports: [MarketplaceService, FoodService],
})
export class MarketplaceModule {}
