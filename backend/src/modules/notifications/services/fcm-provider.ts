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

interface GoogleServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

interface AccessTokenCache {
  token: string;
  expiresAt: number;
}

@Injectable()
export class FcmProvider implements IPushProvider {
  readonly name = PushProvider.FCM;
  private readonly logger = new Logger(FcmProvider.name);
  private readonly httpApiUrl = 'https://fcm.googleapis.com/v1';
  private readonly accessTokens = new Map<string, AccessTokenCache>();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly BATCH_SIZE = 500;
  private readonly BATCH_DELAY_MS = 100;
  private readonly TOKEN_EXPIRY_BUFFER_MS = 300_000;

  constructor(private config: ConfigService) {}

  get isConfigured(): boolean {
    return !!(
      this.config.get<string>('FCM_PROJECT_ID') ||
      this.config.get<string>('FCM_SERVICE_ACCOUNT_KEY')
    );
  }

  private get projectId(): string {
    return this.config.get<string>('FCM_PROJECT_ID', '');
  }

  private get serviceAccountKey(): string {
    return this.config.get<string>('FCM_SERVICE_ACCOUNT_KEY', '');
  }

  private get serviceAccount(): GoogleServiceAccount | null {
    try {
      const key = this.serviceAccountKey;
      if (!key) return null;
      return JSON.parse(key) as GoogleServiceAccount;
    } catch {
      this.logger.error('Failed to parse FCM service account key');
      return null;
    }
  }

  private generateAccessToken(sa: GoogleServiceAccount): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };
    return jwt.sign(payload, sa.private_key, { algorithm: 'RS256' });
  }

  private async getAccessToken(): Promise<string> {
    const sa = this.serviceAccount;
    if (!sa) {
      throw new Error('FCM service account not configured');
    }

    const cached = this.accessTokens.get(sa.project_id);
    if (cached && cached.expiresAt > Date.now() + this.TOKEN_EXPIRY_BUFFER_MS) {
      return cached.token;
    }

    const jwtToken = this.generateAccessToken(sa);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken,
      }).toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to obtain FCM access token: ${data.error_description || response.statusText}`);
    }

    const tokenCache: AccessTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    this.accessTokens.set(sa.project_id, tokenCache);

    return data.access_token;
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
      this.logger.warn(`FCM retry ${attempt + 1}/${this.MAX_RETRIES} after ${delay}ms: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, attempt + 1);
    }
  }

  private buildFcmMessage(message: PushMessage): Record<string, unknown> {
    const fcmMessage: Record<string, unknown> = {
      token: message.token,
    };

    if (message.notification) {
      fcmMessage.notification = {
        title: message.notification.title,
        body: message.notification.body,
        ...(message.notification.imageUrl && { image: message.notification.imageUrl }),
      };
    }

    if (message.data) {
      fcmMessage.data = message.data;
    }

    if (message.android) {
      fcmMessage.android = {
        priority: message.android.priority || PushPriority.NORMAL,
        ...(message.android.ttl && { ttl: `${message.android.ttl}s` }),
        ...(message.android.collapseKey && { collapse_key: message.android.collapseKey }),
        ...(message.android.notificationChannelId && {
          notification: {
            channel_id: message.android.notificationChannelId,
            ...(message.android.notification && {
              title: message.android.notification.title,
              body: message.android.notification.body,
              ...(message.android.notification.clickAction && {
                click_action: message.android.notification.clickAction,
              }),
            }),
          },
        }),
      };
    }

    if (message.apns) {
      fcmMessage.apns = {
        payload: message.apns.payload || {
          aps: {
            alert: message.notification
              ? { title: message.notification.title, body: message.notification.body }
              : undefined,
            sound: 'default',
          },
        },
      };
    }

    if (message.web) {
      fcmMessage.webpush = {
        notification: message.web.notification
          ? {
              title: message.web.notification.title,
              body: message.web.notification.body,
              ...(message.web.notification.imageUrl && {
                image: message.web.notification.imageUrl,
              }),
            }
          : undefined,
        data: message.web.data,
      };
    }

    if (message.topic) {
      delete fcmMessage.token;
      fcmMessage.topic = message.topic;
    }

    if (message.condition) {
      delete fcmMessage.token;
      fcmMessage.condition = message.condition;
    }

    return fcmMessage;
  }

  private isInvalidTokenError(error: any): boolean {
    return (
      error.status === 404 ||
      error.status === 400 ||
      (typeof error.message === 'string' &&
        (error.message.includes('NOT_FOUND') ||
          error.message.includes('INVALID_ARGUMENT') ||
          error.message.includes('registration-token-not-registered')))
    );
  }

  async sendToToken(message: PushMessage): Promise<PushResponse> {
    if (!this.isConfigured) {
      this.logger.warn('FCM not configured, returning mock response');
      return {
        success: false,
        token: message.token,
        error: 'FCM not configured',
        errorCode: 'NOT_CONFIGURED',
      };
    }

    const accessToken = await this.getAccessToken();
    const fcmMessage = this.buildFcmMessage(message);

    const result = await this.retryWithBackoff(async () => {
      const response = await fetch(
        `${this.httpApiUrl}/projects/${this.projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: fcmMessage, validate_only: message.dryRun || false }),
        },
      );

      const body = await response.json();

      if (!response.ok) {
        const error = new Error(body.error?.message || `FCM API error: ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      return body;
    });

    return {
      success: true,
      messageId: result.name || `fcm-${Date.now()}`,
      token: message.token,
    };
  }

  async sendToTopic(message: TopicMessage): Promise<PushResponse> {
    if (!this.isConfigured) {
      return {
        success: false,
        token: '',
        error: 'FCM not configured',
        errorCode: 'NOT_CONFIGURED',
      };
    }

    const accessToken = await this.getAccessToken();
    const fcmMessage: Record<string, unknown> = {
      topic: message.topic,
    };

    if (message.notification) {
      fcmMessage.notification = {
        title: message.notification.title,
        body: message.notification.body,
        ...(message.notification.imageUrl && { image: message.notification.imageUrl }),
      };
    }

    if (message.data) {
      fcmMessage.data = message.data;
    }

    if (message.android) {
      fcmMessage.android = {
        priority: message.android.priority || PushPriority.NORMAL,
        ...(message.android.collapseKey && { collapse_key: message.android.collapseKey }),
      };
    }

    if (message.apns) {
      fcmMessage.apns = {
        payload: message.apns.payload || {
          aps: { sound: 'default' },
        },
      };
    }

    const result = await this.retryWithBackoff(async () => {
      const response = await fetch(
        `${this.httpApiUrl}/projects/${this.projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: fcmMessage }),
        },
      );

      const body = await response.json();

      if (!response.ok) {
        const error = new Error(body.error?.message || `FCM topic error: ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      return body;
    });

    return {
      success: true,
      messageId: result.name || `fcm-topic-${Date.now()}`,
      token: `topic:${message.topic}`,
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

          if (!response.success && response.errorCode) {
            if (this.isInvalidTokenError({ status: parseInt(response.errorCode) })) {
              invalidTokens.push(token);
            }
          }

          return response;
        } catch (error: any) {
          if (this.isInvalidTokenError(error)) {
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
      `FCM bulk: ${totalSent} sent, ${totalFailed} failed, ${invalidTokens.length} invalid tokens`,
    );

    return {
      success: totalSent > 0,
      totalSent,
      totalFailed,
      results,
      invalidTokens,
    };
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isConfigured) return;

    this.logger.log(`Subscribing ${tokens.length} tokens to topic: ${topic}`);

    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `https://iid.googleapis.com/iid/v1:batchAdd`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          registration_tokens: tokens,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`FCM topic subscription failed: ${body}`);
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isConfigured) return;

    this.logger.log(`Unsubscribing ${tokens.length} tokens from topic: ${topic}`);

    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `https://iid.googleapis.com/iid/v1:batchRemove`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          registration_tokens: tokens,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`FCM topic unsubscription failed: ${body}`);
    }
  }

  async deleteToken(token: string): Promise<void> {
    if (!this.isConfigured) return;

    this.logger.log(`Deleting FCM token`);

    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${this.projectId}/registeredDevices/${token}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok && response.status !== 404) {
      const body = await response.text();
      this.logger.warn(`FCM token deletion failed: ${body}`);
    }
  }
}
