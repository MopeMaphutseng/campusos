import { Controller, Post, Body, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SmsUssdService } from './services/sms-ussd.service';

@ApiTags('SMS & USSD')
@Controller('sms-ussd')
export class SmsUssdController {
  constructor(private smsUssdService: SmsUssdService) {}

  @Post('ussd')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle USSD session request' })
  async handleUssd(
    @Body() body: {
      phoneNumber: string;
      universityId: string;
      sessionId: string;
      text: string;
    },
  ) {
    return this.smsUssdService.handleUssdRequest(
      body.phoneNumber,
      body.universityId,
      body.sessionId,
      body.text,
    );
  }

  @Post('sms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle incoming SMS command' })
  async handleSms(
    @Body() body: {
      phoneNumber: string;
      universityId: string;
      message: string;
    },
  ) {
    return this.smsUssdService.handleSmsRequest(
      body.phoneNumber,
      body.universityId,
      body.message,
    );
  }

  @Get('sms/timetable')
  @ApiOperation({ summary: 'Get timetable via SMS format' })
  @ApiQuery({ name: 'universityId', type: String })
  @ApiQuery({ name: 'userId', type: String })
  async getTimetableSms(
    @Query('universityId') universityId: string,
    @Query('userId') userId: string,
  ) {
    return { message: await this.smsUssdService.getTimetableSms(universityId, userId) };
  }

  @Get('sms/results')
  @ApiOperation({ summary: 'Get exam results via SMS format' })
  @ApiQuery({ name: 'universityId', type: String })
  @ApiQuery({ name: 'userId', type: String })
  async getExamResultsSms(
    @Query('universityId') universityId: string,
    @Query('userId') userId: string,
  ) {
    return { message: await this.smsUssdService.getExamResultsSms(universityId, userId) };
  }

  @Get('sms/fees')
  @ApiOperation({ summary: 'Get fee balance via SMS format' })
  @ApiQuery({ name: 'universityId', type: String })
  @ApiQuery({ name: 'userId', type: String })
  async getFeeBalanceSms(
    @Query('universityId') universityId: string,
    @Query('userId') userId: string,
  ) {
    return { message: await this.smsUssdService.getFeeBalanceSms(universityId, userId) };
  }
}
