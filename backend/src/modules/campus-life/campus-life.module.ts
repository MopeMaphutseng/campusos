import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusLifeController } from './campus-life.controller';
import { CampusLifeService } from './campus-life.service';
import { CampusMapLocation } from './entities/campus-map.entity';
import { CafeteriaOrder } from './entities/cafeteria-order.entity';
import { Hostel } from './entities/hostel.entity';
import { Club } from './entities/club.entity';
import { TransportRoute } from './entities/transport-route.entity';
import { PrintService } from './entities/print-service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CampusMapLocation,
      CafeteriaOrder,
      Hostel,
      Club,
      TransportRoute,
      PrintService,
    ]),
  ],
  controllers: [CampusLifeController],
  providers: [CampusLifeService],
  exports: [CampusLifeService],
})
export class CampusLifeModule {}
