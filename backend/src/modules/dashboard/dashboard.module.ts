import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../tenants/entities/user.entity';
import { Enrollment } from '../academics/entities/enrollment.entity';
import { TimetableEntry } from '../academics/entities/timetable.entity';
import { Conversation } from '../messaging/entities/conversation.entity';
import { Message } from '../messaging/entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Enrollment,
      TimetableEntry,
      Conversation,
      Message,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
