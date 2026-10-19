import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AdminContentModule } from './content/admin-content.module';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent]), AdminContentModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
