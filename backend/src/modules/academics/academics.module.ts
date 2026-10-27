import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicsController } from './academics.controller';
import { AcademicsService } from './academics.service';
import { GpaCalculatorService } from './services/gpa-calculator.service';
import { Course } from './entities/course.entity';
import { TimetableEntry } from './entities/timetable.entity';
import { Enrollment } from './entities/enrollment.entity';
import { GradeItem } from './entities/grade-item.entity';
import { CourseMaterial } from './entities/course-material.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, TimetableEntry, Enrollment, GradeItem, CourseMaterial])],
  controllers: [AcademicsController],
  providers: [AcademicsService, GpaCalculatorService],
  exports: [AcademicsService, GpaCalculatorService],
})
export class AcademicsModule {}
