import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { MessagingGateway } from './gateways/messaging.gateway';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { EventsGateway } from './gateways/events.gateway';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'jwt-secret-dev'),
        signOptions: { expiresIn: config.get('JWT_ACCESS_EXPIRY', '15m') },
      }),
    }),
    NotificationsModule,
  ],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway, NotificationsGateway, EventsGateway],
  exports: [MessagingService, MessagingGateway, NotificationsGateway, EventsGateway],
})
export class MessagingModule {}
