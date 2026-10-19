import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from '../../notifications/notifications.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  universityId?: string;
}

interface NotificationReadPayload {
  notificationId: string;
}

interface BulkReadPayload {
  notificationIds: string[];
}

interface UniversityBroadcastPayload {
  title: string;
  body: string;
  priority?: string;
  data?: Record<string, any>;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  namespace: '/notifications',
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 10000,
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  afterInit() {
    this.logger.log('Notifications gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token || typeof token !== 'string') {
        this.logger.warn(`Connection rejected: No token [${client.id}]`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      if (!payload?.sub) {
        this.logger.warn(`Connection rejected: Invalid token [${client.id}]`);
        client.emit('error', { message: 'Invalid token' });
        client.disconnect();
        return;
      }

      const universityId = client.handshake.auth?.universityId || client.handshake.query?.universityId;
      if (!universityId || typeof universityId !== 'string') {
        this.logger.warn(`Connection rejected: No university ID [${client.id}]`);
        client.emit('error', { message: 'University ID required' });
        client.disconnect();
        return;
      }

      client.userId = payload.sub;
      client.universityId = universityId;

      client.join(`user_${payload.sub}`);
      client.join(`university_${universityId}`);

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      const unreadCount = await this.notificationsService.getUnreadCount(universityId, payload.sub);

      client.emit('connected', {
        userId: payload.sub,
        universityId,
        unreadCount,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Notification client connected: ${client.id} | User: ${payload.sub}`,
      );
    } catch (error) {
      this.logger.error(`Connection error: ${error.message} [${client.id}]`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }

      this.logger.log(`Notification client disconnected: ${client.id} | User: ${client.userId}`);
    }
  }

  @SubscribeMessage('notification_read')
  async handleNotificationRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: NotificationReadPayload,
  ) {
    try {
      if (!client.userId || !client.universityId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      const notification = await this.notificationsService.markAsRead(
        client.universityId,
        payload.notificationId,
        client.userId,
      );

      client.emit('notification_read_ack', {
        notificationId: payload.notificationId,
        readAt: notification.readAt,
      });

      return { event: 'notification_read_ack', data: { notificationId: payload.notificationId } };
    } catch (error) {
      this.logger.error(`notification_read error: ${error.message}`);
      return { event: 'error', data: { message: 'Failed to mark notification as read' } };
    }
  }

  @SubscribeMessage('bulk_read')
  async handleBulkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: BulkReadPayload,
  ) {
    try {
      if (!client.userId || !client.universityId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      await Promise.all(
        payload.notificationIds.map((id) =>
          this.notificationsService.markAsRead(client.universityId!, id, client.userId!),
        ),
      );

      client.emit('bulk_read_ack', {
        notificationIds: payload.notificationIds,
        readAt: new Date().toISOString(),
      });

      return { event: 'bulk_read_ack', data: { count: payload.notificationIds.length } };
    } catch (error) {
      this.logger.error(`bulk_read error: ${error.message}`);
      return { event: 'error', data: { message: 'Failed to mark notifications as read' } };
    }
  }

  @SubscribeMessage('mark_all_read')
  async handleMarkAllRead(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      if (!client.userId || !client.universityId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      await this.notificationsService.markAllAsRead(client.universityId, client.userId);

      client.emit('all_read_ack', {
        readAt: new Date().toISOString(),
      });

      return { event: 'all_read_ack', data: { success: true } };
    } catch (error) {
      this.logger.error(`mark_all_read error: ${error.message}`);
      return { event: 'error', data: { message: 'Failed to mark all as read' } };
    }
  }

  sendNotificationToUser(userId: string, notification: {
    id: string;
    title: string;
    body: string;
    type?: string;
    priority?: string;
    module?: string;
    actionUrl?: string;
    data?: Record<string, any>;
    createdAt?: Date;
  }) {
    this.server.to(`user_${userId}`).emit('notification_received', {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      priority: notification.priority,
      module: notification.module,
      actionUrl: notification.actionUrl,
      data: notification.data,
      createdAt: notification.createdAt || new Date(),
      timestamp: new Date().toISOString(),
    });
  }

  broadcastToUniversity(universityId: string, alert: {
    title: string;
    body: string;
    priority?: string;
    data?: Record<string, any>;
  }) {
    this.server.to(`university_${universityId}`).emit('university_alert', {
      title: alert.title,
      body: alert.body,
      priority: alert.priority || 'normal',
      data: alert.data,
      timestamp: new Date().toISOString(),
    });
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && (this.userSockets.get(userId)?.size ?? 0) > 0;
  }
}
