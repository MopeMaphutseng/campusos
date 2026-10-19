import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScholarshipsController } from './scholarships.controller';
import { ScholarshipsService } from './scholarships.service';
import { Scholarship } from './entities/scholarship.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Scholarship])],
  controllers: [ScholarshipsController],
  providers: [ScholarshipsService],
  exports: [ScholarshipsService],
})
export class ScholarshipsModule {}
