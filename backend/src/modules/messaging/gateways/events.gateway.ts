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

interface AuthenticatedSocket extends Socket {
  userId?: string;
  universityId?: string;
}

interface ScoreUpdatePayload {
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period?: string;
  timeRemaining?: string;
  status: 'live' | 'final' | 'upcoming';
}

interface MarketplaceUpdatePayload {
  listingId: string;
  title: string;
  price: number;
  category: string;
  imageUrl?: string;
  action: 'created' | 'updated' | 'sold' | 'removed';
}

interface DeadlineReminderPayload {
  deadlineId: string;
  title: string;
  dueDate: string;
  module: string;
  reminderType: 'initial' | 'urgent' | 'overdue';
}

interface SafetyAlertPayload {
  alertId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  location?: string;
  expiresAt?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  namespace: '/events',
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 10000,
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  afterInit() {
    this.logger.log('Events gateway initialized');
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

      client.join(`university_${universityId}`);
      client.join(`user_${payload.sub}`);

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      client.emit('connected', {
        userId: payload.sub,
        universityId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Events client connected: ${client.id} | User: ${payload.sub} | University: ${universityId}`,
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

      this.logger.log(`Events client disconnected: ${client.id} | User: ${client.userId}`);
    }
  }

  @SubscribeMessage('subscribe_sports')
  handleSubscribeSports(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { sport?: string },
  ) {
    if (!client.universityId) return;

    const room = payload.sport
      ? `sports_${client.universityId}_${payload.sport}`
      : `sports_${client.universityId}`;
    client.join(room);

    this.logger.log(`User ${client.userId} subscribed to ${room}`);

    return {
      event: 'subscribed',
      data: { category: 'sports', sport: payload.sport || 'all' },
    };
  }

  @SubscribeMessage('unsubscribe_sports')
  handleUnsubscribeSports(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { sport?: string },
  ) {
    if (!client.universityId) return;

    const room = payload.sport
      ? `sports_${client.universityId}_${payload.sport}`
      : `sports_${client.universityId}`;
    client.leave(room);

    return {
      event: 'unsubscribed',
      data: { category: 'sports', sport: payload.sport || 'all' },
    };
  }

  @SubscribeMessage('subscribe_marketplace')
  handleSubscribeMarketplace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { category?: string },
  ) {
    if (!client.universityId) return;

    const room = payload.category
      ? `marketplace_${client.universityId}_${payload.category}`
      : `marketplace_${client.universityId}`;
    client.join(room);

    this.logger.log(`User ${client.userId} subscribed to ${room}`);

    return {
      event: 'subscribed',
      data: { category: 'marketplace', filter: payload.category || 'all' },
    };
  }

  @SubscribeMessage('unsubscribe_marketplace')
  handleUnsubscribeMarketplace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { category?: string },
  ) {
    if (!client.universityId) return;

    const room = payload.category
      ? `marketplace_${client.universityId}_${payload.category}`
      : `marketplace_${client.universityId}`;
    client.leave(room);

    return {
      event: 'unsubscribed',
      data: { category: 'marketplace', filter: payload.category || 'all' },
    };
  }

  @SubscribeMessage('subscribe_deadlines')
  handleSubscribeDeadlines(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.universityId) return;

    client.join(`deadlines_${client.userId}`);

    return {
      event: 'subscribed',
      data: { category: 'deadlines' },
    };
  }

  emitScoreUpdate(universityId: string, score: ScoreUpdatePayload) {
    const baseRoom = `sports_${universityId}`;
    this.server.to(baseRoom).emit('score_update', {
      ...score,
      timestamp: new Date().toISOString(),
    });

    const sportRoom = `sports_${universityId}_${score.sport}`;
    this.server.to(sportRoom).emit('score_update', {
      ...score,
      timestamp: new Date().toISOString(),
    });
  }

  emitMarketplaceUpdate(universityId: string, update: MarketplaceUpdatePayload) {
    const baseRoom = `marketplace_${universityId}`;
    this.server.to(baseRoom).emit('marketplace_listing_update', {
      ...update,
      timestamp: new Date().toISOString(),
    });

    const categoryRoom = `marketplace_${universityId}_${update.category}`;
    this.server.to(categoryRoom).emit('marketplace_listing_update', {
      ...update,
      timestamp: new Date().toISOString(),
    });
  }

  emitDeadlineReminder(userId: string, reminder: DeadlineReminderPayload) {
    this.server.to(`deadlines_${userId}`).emit('deadline_reminder', {
      ...reminder,
      timestamp: new Date().toISOString(),
    });
  }

  emitSafetyAlert(universityId: string, alert: SafetyAlertPayload) {
    this.server.to(`university_${universityId}`).emit('safety_alert', {
      ...alert,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastToUniversity(universityId: string, event: string, data: any) {
    this.server.to(`university_${universityId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
