import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobListing } from './entities/job-listing.entity';
import { AiTutorModule } from '../ai-tutor/ai-tutor.module';

@Module({
  imports: [TypeOrmModule.forFeature([JobListing]), AiTutorModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
