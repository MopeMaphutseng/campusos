import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InnovationHubController } from './innovation-hub.controller';
import { InnovationHubService } from './innovation-hub.service';
import { InnovationProject } from './entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InnovationProject])],
  controllers: [InnovationHubController],
  providers: [InnovationHubService],
  exports: [InnovationHubService],
})
export class InnovationHubModule {}
