import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { FcmProvider } from './services/fcm-provider';
import { ApnsProvider } from './services/apns-provider';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), ConfigModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, FcmProvider, ApnsProvider],
  exports: [NotificationsService, FcmProvider, ApnsProvider],
})
export class NotificationsModule {}
