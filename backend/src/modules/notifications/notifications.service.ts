import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationType, NotificationPriority } from './entities/notification.entity';
import { DeviceToken } from './entities/device-token.entity';
import { FcmProvider } from './services/fcm-provider';
import { ApnsProvider } from './services/apns-provider';
import {
  PushMessage,
  PushResponse,
  PushBulkMessage,
  BulkPushResponse,
  PushNotification,
  PushDataPayload,
  PushPriority,
  PushPlatform,
} from './services/push-provider.interface';

export enum NotificationTemplate {
  CLASS_REMINDER = 'class_reminder',
  DEADLINE_ALERT = 'deadline_alert',
  MESSAGE_RECEIVED = 'message_received',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  SCHOLARSHIP_DEADLINE = 'scholarship_deadline',
  SAFETY_ALERT = 'safety_alert',
  MARKETPLACE_UPDATE = 'marketplace_update',
  EXAM_SCHEDULE = 'exam_schedule',
  RESULTS_READY = 'results_ready',
}

interface NotificationTemplateContent {
  title: string;
  body: string;
  data?: PushDataPayload;
}

export interface UserNotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  quietHoursStart?: number;
  quietHoursEnd?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly sentDeduplication = new Map<string, Date>();
  private readonly DEDUP_WINDOW_MS = 300_000;

  constructor(
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
    @InjectRepository(DeviceToken) private deviceTokenRepo: Repository<DeviceToken>,
    private config: ConfigService,
    private fcmProvider: FcmProvider,
    private apnsProvider: ApnsProvider,
  ) {}

  private renderTemplate(
    template: NotificationTemplate,
    data?: Record<string, any>,
  ): NotificationTemplateContent {
    const d = data || {};
    const templates: Record<NotificationTemplate, () => NotificationTemplateContent> = {
      [NotificationTemplate.CLASS_REMINDER]: () => ({
        title: 'Class Reminder',
        body: `${d.courseCode || ''} ${d.courseName || 'class'} starts at ${d.time || 'N/A'} in ${d.room || 'N/A'}`,
        data: { type: 'class_reminder', courseId: String(d.courseId || ''), time: String(d.time || '') },
      }),
      [NotificationTemplate.DEADLINE_ALERT]: () => ({
        title: 'Deadline Alert',
        body: `${d.title || 'Assignment'} is due ${d.dueDate || 'soon'}`,
        data: { type: 'deadline_alert', deadlineId: String(d.deadlineId || '') },
      }),
      [NotificationTemplate.MESSAGE_RECEIVED]: () => ({
        title: d.senderName || 'New Message',
        body: d.preview || 'You have a new message',
        data: { type: 'message_received', conversationId: String(d.conversationId || '') },
      }),
      [NotificationTemplate.PAYMENT_CONFIRMED]: () => ({
        title: 'Payment Confirmed',
        body: `Payment of ${d.amount || 'N/A'} received. Ref: ${d.reference || 'N/A'}`,
        data: { type: 'payment_confirmed', transactionId: String(d.transactionId || '') },
      }),
      [NotificationTemplate.SCHOLARSHIP_DEADLINE]: () => ({
        title: 'Scholarship Deadline',
        body: `${d.scholarshipName || 'Scholarship'} deadline: ${d.deadline || 'soon'}`,
        data: { type: 'scholarship_deadline', scholarshipId: String(d.scholarshipId || '') },
      }),
      [NotificationTemplate.SAFETY_ALERT]: () => ({
        title: '⚠ Safety Alert',
        body: d.message || 'Important safety information',
        data: { type: 'safety_alert', priority: 'urgent' },
      }),
      [NotificationTemplate.MARKETPLACE_UPDATE]: () => ({
        title: 'Marketplace Update',
        body: d.message || 'New activity on your listing',
        data: { type: 'marketplace_update', listingId: String(d.listingId || '') },
      }),
      [NotificationTemplate.EXAM_SCHEDULE]: () => ({
        title: 'Exam Schedule',
        body: `${d.courseCode || ''} exam on ${d.examDate || 'N/A'} at ${d.examTime || 'N/A'}`,
        data: { type: 'exam_schedule', courseId: String(d.courseId || '') },
      }),
      [NotificationTemplate.RESULTS_READY]: () => ({
        title: 'Results Ready',
        body: `Your ${d.semester || 'semester'} results are now available`,
        data: { type: 'results_ready', semester: String(d.semester || '') },
      }),
    };

    return templates[template]?.() || { title: 'Notification', body: '' };
  }

  private isQuietHours(userId: string): boolean {
    const now = new Date();
    const hour = now.getHours();
    const quietStart = 22;
    const quietEnd = 7;
    return hour >= quietStart || hour < quietEnd;
  }

  private isDuplicate(key: string): boolean {
    const lastSent = this.sentDeduplication.get(key);
    if (lastSent && Date.now() - lastSent.getTime() < this.DEDUP_WINDOW_MS) {
      return true;
    }
    this.sentDeduplication.set(key, new Date());
    return false;
  }

  private detectPlatform(token: string): PushPlatform {
    if (token.length === 64 && /^[a-f0-9]+$/i.test(token)) {
      return PushPlatform.IOS;
    }
    if (token.length > 150 && token.includes(':')) {
      return PushPlatform.ANDROID;
    }
    return PushPlatform.WEB;
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationRepo.create(data);
    return this.notificationRepo.save(notification);
  }

  async createBulk(
    universityId: string,
    userIds: string[],
    data: {
      title: string;
      body: string;
      module?: string;
      actionType?: string;
      actionUrl?: string;
      priority?: NotificationPriority;
      type?: NotificationType;
    },
  ): Promise<Notification[]> {
    const notifications = userIds.map((userId) =>
      this.notificationRepo.create({
        universityId,
        userId,
        ...data,
        type: data.type || NotificationType.IN_APP,
        priority: data.priority || NotificationPriority.NORMAL,
      }),
    );
    return this.notificationRepo.save(notifications);
  }

  async findUserNotifications(
    universityId: string,
    userId: string,
    unreadOnly?: boolean,
  ): Promise<Notification[]> {
    const where: any = { universityId, userId };
    if (unreadOnly) where.read = false;
    return this.notificationRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(universityId: string, userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { universityId, userId, read: false },
    });
  }

  async markAsRead(
    universityId: string,
    id: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, universityId, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.read = true;
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(universityId: string, userId: string): Promise<void> {
    await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ read: true, readAt: new Date() })
      .where('universityId = :universityId', { universityId })
      .andWhere('userId = :userId', { userId })
      .andWhere('read = false')
      .execute();
  }

  async deleteNotification(
    universityId: string,
    id: string,
    userId: string,
  ): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      where: { id, universityId, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.notificationRepo.softRemove(notification);
  }

  async sendPushNotification(data: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<PushResponse> {
    const platform = this.detectPlatform(data.token);

    const message: PushMessage = {
      token: data.token,
      notification: { title: data.title, body: data.body },
      data: data.data as PushDataPayload,
      android: { priority: PushPriority.NORMAL },
      apns: {
        payload: {
          aps: {
            alert: { title: data.title, body: data.body },
            sound: 'default',
          },
        },
      },
    };

    if (platform === PushPlatform.IOS && this.apnsProvider.isConfigured) {
      return this.apnsProvider.sendToToken(message);
    }

    return this.fcmProvider.sendToToken(message);
  }

  async sendTemplateNotification(
    universityId: string,
    userId: string,
    template: NotificationTemplate,
    data?: Record<string, unknown>,
    channels?: { push?: boolean; inApp?: boolean; sms?: boolean },
  ): Promise<{ inApp?: Notification; push?: PushResponse }> {
    const content = this.renderTemplate(template, data);
    const result: { inApp?: Notification; push?: PushResponse } = {};

    if (channels?.inApp !== false) {
      result.inApp = await this.create({
        universityId,
        userId,
        title: content.title,
        body: content.body,
        module: template,
        type: NotificationType.IN_APP,
        priority: template === NotificationTemplate.SAFETY_ALERT
          ? NotificationPriority.URGENT
          : NotificationPriority.NORMAL,
        data: content.data || {},
      });
    }

    if (channels?.push !== false) {
      const dedupKey = `${universityId}:${userId}:${template}:${JSON.stringify(content.data)}`;
      if (!this.isDuplicate(dedupKey)) {
        const tokens = await this.getUserTokens(userId, universityId);
        if (tokens.length > 0) {
          const pushResponse = await this.fcmProvider.sendBulk({
            tokens: tokens.map((t) => t.token),
            notification: content,
            data: content.data,
            android: {
              priority: template === NotificationTemplate.SAFETY_ALERT
                ? PushPriority.HIGH
                : PushPriority.NORMAL,
              notificationChannelId: 'campus_updates',
            },
            apns: {
              payload: {
                aps: {
                  alert: { title: content.title, body: content.body },
                  sound: 'default',
                  'thread-id': template,
                },
              },
            },
          });

          if (pushResponse.invalidTokens.length > 0) {
            for (const token of pushResponse.invalidTokens) {
              await this.removeFcmToken(universityId, userId, token);
            }
          }

          result.push = {
            success: pushResponse.success,
            token: '',
            messageId: `bulk-${pushResponse.totalSent}`,
          };
        }
      }
    }

    return result;
  }

  async sendUniversityBroadcast(
    universityId: string,
    template: NotificationTemplate,
    data?: Record<string, unknown>,
  ): Promise<{ totalInApp: number; push?: BulkPushResponse }> {
    const content = this.renderTemplate(template, data);

    const notifications = await this.notificationRepo.find({
      where: { universityId },
      select: ['userId'],
      order: { createdAt: 'DESC' },
      take: 10000,
    });

    const uniqueUserIds = [...new Set(notifications.map((n) => n.userId))];

    const inAppNotifications = uniqueUserIds.map((userId) =>
      this.notificationRepo.create({
        universityId,
        userId,
        title: content.title,
        body: content.body,
        module: template,
        type: NotificationType.IN_APP,
        priority: template === NotificationTemplate.SAFETY_ALERT
          ? NotificationPriority.URGENT
          : NotificationPriority.NORMAL,
        data: content.data || {},
      }),
    );

    await this.notificationRepo.save(inAppNotifications);

    const allTokens = await this.getUniversityTokens(universityId);
    let pushResult: BulkPushResponse | undefined;

    if (allTokens.length > 0) {
      pushResult = await this.fcmProvider.sendBulk({
        tokens: allTokens,
        notification: content,
        data: content.data,
        android: {
          priority: PushPriority.HIGH,
          notificationChannelId: 'university_broadcast',
        },
        apns: {
          payload: {
            aps: {
              alert: { title: content.title, body: content.body },
              sound: 'default',
              'thread-id': 'university_broadcast',
            },
          },
        },
      });

      if (pushResult.invalidTokens.length > 0) {
        for (const token of pushResult.invalidTokens) {
          await this.deviceTokenRepo.update({ token }, { isActive: false });
        }
      }
    }

    return {
      totalInApp: inAppNotifications.length,
      push: pushResult,
    };
  }

  async getNotificationPreferences(
    universityId: string,
    userId: string,
  ): Promise<UserNotificationPreferences> {
    return {
      push: true,
      email: true,
      sms: false,
      quietHoursStart: 22,
      quietHoursEnd: 7,
    };
  }

  async updateNotificationPreferences(
    universityId: string,
    userId: string,
    preferences: Partial<UserNotificationPreferences>,
  ): Promise<void> {
    this.logger.log(`Updated notification preferences for ${userId} in ${universityId}`);
  }

  async registerFcmToken(
    universityId: string,
    userId: string,
    token: string,
    platform?: PushPlatform,
  ): Promise<void> {
    const detected = platform || this.detectPlatform(token);
    const existing = await this.deviceTokenRepo.findOne({ where: { token } });
    if (existing) {
      existing.userId = userId;
      existing.universityId = universityId;
      existing.platform = detected;
      existing.lastUsedAt = new Date();
      existing.isActive = true;
      await this.deviceTokenRepo.save(existing);
    } else {
      await this.deviceTokenRepo.save(
        this.deviceTokenRepo.create({
          token,
          userId,
          universityId,
          platform: detected,
          lastUsedAt: new Date(),
          isActive: true,
        }),
      );
    }
    this.logger.log(`FCM token registered for ${userId} (${detected}) in ${universityId}`);
  }

  async removeFcmToken(
    universityId: string,
    userId: string,
    token: string,
  ): Promise<void> {
    const record = await this.deviceTokenRepo.findOne({
      where: { token, userId, universityId },
    });
    if (record) {
      record.isActive = false;
      await this.deviceTokenRepo.save(record);
      this.logger.log(`FCM token removed for ${userId} in ${universityId}`);
    }
  }

  private async getUserTokens(userId: string, universityId: string): Promise<DeviceToken[]> {
    return this.deviceTokenRepo.find({
      where: { userId, universityId, isActive: true },
    });
  }

  private async getUniversityTokens(universityId: string): Promise<string[]> {
    const records = await this.deviceTokenRepo.find({
      where: { universityId, isActive: true },
    });
    return records.map((r) => r.token);
  }

  async cleanupStaleTokens(maxAgeDays: number = 90): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    const result = await this.deviceTokenRepo
      .createQueryBuilder()
      .update(DeviceToken)
      .set({ isActive: false })
      .where('last_used_at < :cutoff', { cutoff })
      .andWhere('is_active = true')
      .execute();
    const cleaned = result.affected || 0;
    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} stale FCM tokens`);
    }
    return cleaned;
  }
}
