export enum PushProvider {
  FCM = 'fcm',
  APNS = 'apns',
}

export enum PushPlatform {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

export enum PushPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export enum PushNotificationSound {
  DEFAULT = 'default',
}

export interface PushNotification {
  title: string;
  body: string;
  imageUrl?: string;
  clickAction?: string;
  tag?: string;
  imageUrlAlt?: string;
}

export interface PushDataPayload {
  [key: string]: string;
}

export interface PushAndroidConfig {
  notification?: PushNotification;
  priority?: PushPriority;
  ttl?: number;
  collapseKey?: string;
  restrictedPackageName?: string;
  notificationChannelId?: string;
}

export interface PushApnsConfig {
  payload?: {
    aps: {
      alert?: {
        title?: string;
        subtitle?: string;
        body?: string;
      };
      badge?: number;
      sound?: string | { critical: number; name: string; volume: number };
      'content-available'?: number;
      'mutable-content'?: number;
      'thread-id'?: string;
      category?: string;
    };
  };
}

export interface PushWebConfig {
  notification?: PushNotification;
  data?: PushDataPayload;
}

export interface PushMessage {
  token: string;
  notification?: PushNotification;
  data?: PushDataPayload;
  android?: PushAndroidConfig;
  apns?: PushApnsConfig;
  web?: PushWebConfig;
  topic?: string;
  condition?: string;
  dryRun?: boolean;
}

export interface PushBulkMessage {
  tokens: string[];
  notification?: PushNotification;
  data?: PushDataPayload;
  android?: PushAndroidConfig;
  apns?: PushApnsConfig;
  dryRun?: boolean;
}

export interface PushResponse {
  success: boolean;
  messageId?: string;
  token: string;
  error?: string;
  errorCode?: string;
}

export interface BulkPushResponse {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: PushResponse[];
  invalidTokens: string[];
}

export interface TopicMessage {
  topic: string;
  notification: PushNotification;
  data?: PushDataPayload;
  android?: PushAndroidConfig;
  apns?: PushApnsConfig;
}

export interface IPushProvider {
  readonly name: PushProvider;
  readonly isConfigured: boolean;

  sendToToken(message: PushMessage): Promise<PushResponse>;
  sendToTopic(message: TopicMessage): Promise<PushResponse>;
  sendToUser(userId: string, notification: PushNotification, data?: PushDataPayload): Promise<PushResponse>;
  sendBulk(message: PushBulkMessage): Promise<BulkPushResponse>;
  subscribeToTopic(tokens: string[], topic: string): Promise<void>;
  unsubscribeFromTopic(tokens: string[], topic: string): Promise<void>;
  deleteToken(token: string): Promise<void>;
}
