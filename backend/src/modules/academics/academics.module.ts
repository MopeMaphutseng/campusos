import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicsController } from './academics.controller';
import { AcademicsService } from './academics.service';
import { Course } from './entities/course.entity';
import { TimetableEntry } from './entities/timetable.entity';
import { Enrollment } from './entities/enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, TimetableEntry, Enrollment])],
  controllers: [AcademicsController],
  providers: [AcademicsService],
  exports: [AcademicsService],
})
export class AcademicsModule {}
