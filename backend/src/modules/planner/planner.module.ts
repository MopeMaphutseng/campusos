import { Module } from '@nestjs/common';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { AiTutorModule } from '../ai-tutor/ai-tutor.module';

@Module({
  imports: [AiTutorModule],
  controllers: [PlannerController],
  providers: [PlannerService],
})
export class PlannerModule {}
