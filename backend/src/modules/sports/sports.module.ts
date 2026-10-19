import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';
import { SportsMatch } from './entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SportsMatch])],
  controllers: [SportsController],
  providers: [SportsService],
  exports: [SportsService],
})
export class SportsModule {}
