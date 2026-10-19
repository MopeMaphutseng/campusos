import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResearchHubController } from './research-hub.controller';
import { ResearchHubService } from './research-hub.service';
import { ResearchCall } from './entities/research-call.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ResearchCall])],
  controllers: [ResearchHubController],
  providers: [ResearchHubService],
  exports: [ResearchHubService],
})
export class ResearchHubModule {}
