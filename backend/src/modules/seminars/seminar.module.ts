import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeminarController } from './seminar.controller';
import { SeminarService } from './seminar.service';
import { Seminar } from './entities/seminar.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Seminar])],
  controllers: [SeminarController],
  providers: [SeminarService],
  exports: [SeminarService],
})
export class SeminarsModule {}
