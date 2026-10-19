import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ISmsProvider,
  SmsProvider,
  SmsMessage,
  SmsBulkMessage,
  SmsResponse,
  BulkSmsResponse,
  DeliveryStatus,
  DeliveryStatusResponse,
} from './sms-provider.interface';

@Injectable()
export class TwilioProvider implements ISmsProvider {
  readonly name = SmsProvider.TWILIO;
  private readonly logger = new Logger(TwilioProvider.name);
  private readonly baseUrl = 'https://api.twilio.com/2010-04-01';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_DELAY_MS = 1000;

  constructor(private config: ConfigService) {}

  get isConfigured(): boolean {
    return !!(
      this.config.get<string>('SMS_ACCOUNT_SID') &&
      this.config.get<string>('SMS_AUTH_TOKEN') &&
      this.config.get<string>('SMS_FROM_NUMBER')
    );
  }

  private get accountSid(): string {
    return this.config.get<string>('SMS_ACCOUNT_SID', '');
  }

  private get authToken(): string {
    return this.config.get<string>('SMS_AUTH_TOKEN', '');
  }

  private get defaultFrom(): string {
    return this.config.get<string>('SMS_FROM_NUMBER', '');
  }

  private get isSandbox(): boolean {
    return this.config.get<string>('SMS_SANDBOX', 'false') === 'true';
  }

  private buildAuth(): string {
    const credentials = `${this.accountSid}:${this.authToken}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt >= this.MAX_RETRIES) throw error;

      const isRetryable =
        error.status === 429 ||
        error.status === 500 ||
        error.status === 502 ||
        error.status === 503;
      if (!isRetryable) throw error;

      const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
      this.logger.warn(
        `Retry ${attempt + 1}/${this.MAX_RETRIES} after ${delay}ms: ${error.message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, attempt + 1);
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('0')) {
        cleaned = '+266' + cleaned.substring(1);
      } else {
        cleaned = '+' + cleaned;
      }
    }
    return cleaned;
  }

  async sendSms(message: SmsMessage): Promise<SmsResponse> {
    if (!this.isConfigured) {
      this.logger.warn('Twilio not configured, returning mock response');
      return {
        success: false,
        messageId: '',
        status: DeliveryStatus.FAILED,
        to: message.to,
        from: message.from || this.defaultFrom,
        body: message.body,
        errorCode: 'NOT_CONFIGURED',
        errorMessage: 'Twilio credentials not configured',
      };
    }

    const to = this.formatPhoneNumber(message.to);
    const from = message.from || this.defaultFrom;

    this.logger.log(`Sending SMS to ${to} from ${from}`);

    const result = await this.retryWithBackoff(async () => {
      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', from);
      params.append('Body', message.body);

      if (message.mediaUrl?.length) {
        for (const url of message.mediaUrl) {
          params.append('MediaUrl', url);
        }
      }

      if (message.statusCallback) {
        params.append('StatusCallback', message.statusCallback);
      }

      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: this.buildAuth(),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        },
      );

      const body = await response.json();

      if (!response.ok) {
        this.logger.error(
          `Twilio API error: ${response.status} - ${JSON.stringify(body)}`,
        );
        const error = new Error(
          `Twilio API error: ${body.message || response.statusText}`,
        );
        (error as any).status = response.status;
        (error as any).code = body.code;
        throw error;
      }

      return body;
    });

    return {
      success: true,
      messageId: result.sid,
      status: this.mapTwilioStatus(result.status),
      to,
      from,
      body: message.body,
      errorCode: result.error_code?.toString(),
      errorMessage: result.error_message,
      dateCreated: result.date_created ? new Date(result.date_created) : undefined,
      dateSent: result.date_sent ? new Date(result.date_sent) : undefined,
      price: result.price,
      priceUnit: result.price_unit,
      raw: result,
    };
  }

  async sendBulkSms(message: SmsBulkMessage): Promise<BulkSmsResponse> {
    const results: SmsResponse[] = [];
    const batches: string[][] = [];

    for (let i = 0; i < message.recipients.length; i += this.BATCH_SIZE) {
      batches.push(message.recipients.slice(i, i + this.BATCH_SIZE));
    }

    for (const batch of batches) {
      const batchPromises = batch.map((recipient) =>
        this.sendSms({
          to: recipient,
          from: message.from,
          body: message.body,
          universityId: message.universityId,
          userId: message.userId,
        }).catch((error) => ({
          success: false,
          messageId: '',
          status: DeliveryStatus.FAILED,
          to: recipient,
          from: message.from || this.defaultFrom,
          body: message.body,
          errorCode: 'BATCH_ERROR',
          errorMessage: error.message,
        })),
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, this.BATCH_DELAY_MS));
      }
    }

    const totalSent = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;

    return {
      success: totalSent > 0,
      totalSent,
      totalFailed,
      results,
    };
  }

  async checkDeliveryStatus(messageId: string): Promise<DeliveryStatusResponse> {
    if (!this.isConfigured) {
      return {
        messageId,
        status: DeliveryStatus.UNKNOWN,
        errorCode: 'NOT_CONFIGURED',
        errorMessage: 'Twilio credentials not configured',
      };
    }

    this.logger.log(`Checking delivery status for message ${messageId}`);

    const result = await this.retryWithBackoff(async () => {
      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}/Messages/${messageId}.json`,
        {
          method: 'GET',
          headers: {
            Authorization: this.buildAuth(),
            'Content-Type': 'application/json',
          },
        },
      );

      const body = await response.json();

      if (!response.ok) {
        const error = new Error(
          `Twilio API error: ${body.message || response.statusText}`,
        );
        (error as any).status = response.status;
        throw error;
      }

      return body;
    });

    return {
      messageId: result.sid,
      status: this.mapTwilioStatus(result.status),
      errorCode: result.error_code?.toString(),
      errorMessage: result.error_message,
      dateUpdated: result.date_updated ? new Date(result.date_updated) : undefined,
      dateSent: result.date_sent ? new Date(result.date_sent) : undefined,
      raw: result,
    };
  }

  private mapTwilioStatus(
    status: string,
  ): DeliveryStatus {
    const statusMap: Record<string, DeliveryStatus> = {
      queued: DeliveryStatus.QUEUED,
      sending: DeliveryStatus.SENT,
      sent: DeliveryStatus.SENT,
      delivered: DeliveryStatus.DELIVERED,
      undelivered: DeliveryStatus.UNDELIVERED,
      failed: DeliveryStatus.FAILED,
    };
    return statusMap[status] || DeliveryStatus.UNKNOWN;
  }
}
