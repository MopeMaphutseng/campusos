import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SmsUssdController } from './sms-ussd.controller';
import { SmsUssdService } from './services/sms-ussd.service';
import { TwilioProvider } from './services/twilio-provider';
import { UssdProvider } from './services/ussd-provider';

@Module({
  imports: [TypeOrmModule.forFeature([]), ConfigModule],
  controllers: [SmsUssdController],
  providers: [SmsUssdService, TwilioProvider, UssdProvider],
  exports: [SmsUssdService, TwilioProvider, UssdProvider],
})
export class SmsUssdModule {}
