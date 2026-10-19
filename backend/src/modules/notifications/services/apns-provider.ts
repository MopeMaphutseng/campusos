import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import {
  IPushProvider,
  PushProvider,
  PushMessage,
  PushBulkMessage,
  PushResponse,
  BulkPushResponse,
  TopicMessage,
  PushNotification,
  PushDataPayload,
  PushPriority,
} from './push-provider.interface';

interface ApnsJwtPayload {
  iss: string;
  iat: number;
  exp: number;
}

interface ApnsJwtCache {
  token: string;
  expiresAt: number;
}

@Injectable()
export class ApnsProvider implements IPushProvider {
  readonly name = PushProvider.APNS;
  private readonly logger = new Logger(ApnsProvider.name);
  private readonly SANDBOX_URL = 'https://api.sandbox.push.apple.com';
  private readonly PRODUCTION_URL = 'https://api.push.apple.com';
  private readonly jwtCache: ApnsJwtCache | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly BATCH_SIZE = 100;
  private readonly BATCH_DELAY_MS = 100;
  private readonly JWT_EXPIRY_BUFFER_MS = 300_000;

  constructor(private config: ConfigService) {}

  get isConfigured(): boolean {
    return !!(
      this.config.get<string>('APNS_KEY_ID') &&
      this.config.get<string>('APNS_TEAM_ID') &&
      this.config.get<string>('APNS_KEY_PATH')
    );
  }

  private get keyId(): string {
    return this.config.get<string>('APNS_KEY_ID', '');
  }

  private get teamId(): string {
    return this.config.get<string>('APNS_TEAM_ID', '');
  }

  private get keyPath(): string {
    return this.config.get<string>('APNS_KEY_PATH', '');
  }

  private get bundleId(): string {
    return this.config.get<string>('APNS_BUNDLE_ID', 'com.campusos.app');
  }

  private get isProduction(): boolean {
    return this.config.get<string>('APNS_ENVIRONMENT', 'sandbox') === 'production';
  }

  private get gatewayUrl(): string {
    return this.isProduction ? this.PRODUCTION_URL : this.SANDBOX_URL;
  }

  private generateJwt(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: ApnsJwtPayload = {
      iss: this.teamId,
      iat: now,
      exp: now + 3600,
    };

    const privateKey = this.config.get<string>('APNS_PRIVATE_KEY', '');
    if (!privateKey) {
      throw new Error('APNs private key not configured');
    }

    return jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: this.keyId,
      },
    });
  }

  private getAuthToken(): string {
    return this.generateJwt();
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt >= this.MAX_RETRIES) throw error;

      const isRetryable =
        error.status === 429 ||
        error.status === 500 ||
        error.status === 503;
      if (!isRetryable) throw error;

      const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
      this.logger.warn(`APNs retry ${attempt + 1}/${this.MAX_RETRIES} after ${delay}ms: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, attempt + 1);
    }
  }

  private buildApnsPayload(
    notification?: PushNotification,
    badge?: number,
    sound?: string,
    threadId?: string,
    data?: PushDataPayload,
  ): Record<string, unknown> {
    const aps: Record<string, unknown> = {};

    if (notification) {
      aps.alert = {
        title: notification.title,
        body: notification.body,
      };
    }

    if (badge !== undefined) {
      aps.badge = badge;
    }

    aps.sound = sound || 'default';

    if (threadId) {
      aps['thread-id'] = threadId;
    }

    if (data) {
      aps['content-available'] = 1;
    }

    const payload: Record<string, unknown> = { aps };

    if (data) {
      for (const [key, value] of Object.entries(data)) {
        payload[key] = value;
      }
    }

    return payload;
  }

  async sendToToken(message: PushMessage): Promise<PushResponse> {
    if (!this.isConfigured) {
      this.logger.warn('APNs not configured, returning mock response');
      return {
        success: false,
        token: message.token,
        error: 'APNs not configured',
        errorCode: 'NOT_CONFIGURED',
      };
    }

    const authToken = this.getAuthToken();
    const payload = this.buildApnsPayload(
      message.notification,
      message.apns?.payload?.aps?.badge,
      typeof message.apns?.payload?.aps?.sound === 'string'
        ? message.apns.payload.aps.sound
        : 'default',
      message.apns?.payload?.aps?.['thread-id'],
      message.data,
    );

    this.logger.log(`Sending APNs push to device`);

    const result = await this.retryWithBackoff(async () => {
      const headers: Record<string, string> = {
        'apns-topic': this.bundleId,
        'apns-push-type': 'alert',
        'apns-priority': message.android?.priority === PushPriority.HIGH ? '10' : '5',
        'apns-auth-token': authToken,
        'Content-Type': 'application/json',
      };

      if (message.android?.collapseKey) {
        headers['apns-collapse-id'] = message.android.collapseKey;
      }

      if (message.apns?.payload?.aps?.['mutable-content']) {
        headers['apns-push-type'] = 'mutable-content';
      }

      const response = await fetch(
        `${this.gatewayUrl}/3/device/${message.token}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        let parsed: { reason?: string } = {};
        try {
          parsed = JSON.parse(body);
        } catch {}

        const error = new Error(`APNs error: ${response.status} - ${parsed.reason || body}`);
        (error as any).status = response.status;
        (error as any).reason = parsed.reason;
        throw error;
      }

      const apnsId = response.headers.get('apns-id') || `apns-${Date.now()}`;
      return { apnsId };
    });

    return {
      success: true,
      messageId: result.apnsId,
      token: message.token,
    };
  }

  async sendToTopic(message: TopicMessage): Promise<PushResponse> {
    this.logger.warn('APNs does not support topic-based sending via device token. Use sendToToken.');

    return {
      success: false,
      token: '',
      error: 'APNs does not support topic messaging via this method',
      errorCode: 'NOT_SUPPORTED',
    };
  }

  async sendToUser(
    userId: string,
    notification: PushNotification,
    data?: PushDataPayload,
  ): Promise<PushResponse> {
    return this.sendToToken({
      token: userId,
      notification,
      data,
    });
  }

  async sendBulk(message: PushBulkMessage): Promise<BulkPushResponse> {
    const results: PushResponse[] = [];
    const invalidTokens: string[] = [];
    const batches: string[][] = [];

    for (let i = 0; i < message.tokens.length; i += this.BATCH_SIZE) {
      batches.push(message.tokens.slice(i, i + this.BATCH_SIZE));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (token) => {
        try {
          const response = await this.sendToToken({
            token,
            notification: message.notification,
            data: message.data,
            android: message.android,
            apns: message.apns,
            dryRun: message.dryRun,
          });

          if (!response.success) {
            if (
              response.errorCode === 'BadDeviceToken' ||
              response.errorCode === 'Unregistered' ||
              response.errorCode === 'DeviceTokenNotForTopic'
            ) {
              invalidTokens.push(token);
            }
          }

          return response;
        } catch (error: any) {
          if (error.reason === 'BadDeviceToken' || error.reason === 'Unregistered') {
            invalidTokens.push(token);
          }
          return {
            success: false,
            token,
            error: error.message,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, this.BATCH_DELAY_MS));
      }
    }

    const totalSent = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;

    this.logger.log(
      `APNs bulk: ${totalSent} sent, ${totalFailed} failed, ${invalidTokens.length} invalid tokens`,
    );

    return {
      success: totalSent > 0,
      totalSent,
      totalFailed,
      results,
      invalidTokens,
    };
  }

  async subscribeToTopic(_tokens: string[], _topic: string): Promise<void> {
    this.logger.warn('APNs does not use topic subscriptions via device tokens');
  }

  async unsubscribeFromTopic(_tokens: string[], _topic: string): Promise<void> {
    this.logger.warn('APNs does not use topic subscriptions via device tokens');
  }

  async deleteToken(token: string): Promise<void> {
    this.logger.log(`APNs token cleanup requested for device`);
  }
}
