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
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { MessagingService } from '../messaging.service';
import { Conversation } from '../entities/conversation.entity';
import { Message, MessageStatus } from '../entities/message.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  universityId?: string;
  user?: {
    id: string;
    email: string;
    universityId: string;
    role: string;
  };
}

interface JoinConversationPayload {
  conversationId: string;
}

interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: string;
  replyToId?: string;
  fileUrl?: string;
  fileName?: string;
}

interface TypingPayload {
  conversationId: string;
}

interface MessageReadPayload {
  conversationId: string;
  messageIds: string[];
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  namespace: '/messaging',
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 10000,
})
export class MessagingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  private readonly connectedUsers = new Map<string, Set<string>>();
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly socketRooms = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagingService: MessagingService,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  afterInit() {
    this.logger.log('Messaging gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token || typeof token !== 'string') {
        this.logger.warn(`Connection rejected: No token provided [${client.id}]`);
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
      client.user = {
        id: payload.sub,
        email: payload.email,
        universityId,
        role: payload.role,
      };

      client.join(`university_${universityId}`);
      client.join(`user_${payload.sub}`);

      this.trackConnection(client);
      this.server.to(`university_${universityId}`).emit('user_online', {
        userId: payload.sub,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Client connected: ${client.id} | User: ${payload.sub} | University: ${universityId}`,
      );

      client.emit('connected', {
        userId: payload.sub,
        universityId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message} [${client.id}]`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.untrackConnection(client);

    if (client.userId && client.universityId) {
      this.server.to(`university_${client.universityId}`).emit('user_offline', {
        userId: client.userId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Client disconnected: ${client.id} | User: ${client.userId}`,
      );
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinConversationPayload,
  ) {
    try {
      if (!client.userId || !client.universityId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      const conversation = await this.conversationRepo.findOne({
        where: { id: payload.conversationId, universityId: client.universityId },
      });

      if (!conversation) {
        return { event: 'error', data: { message: 'Conversation not found' } };
      }

      if (!conversation.participantIds.includes(client.userId)) {
        return { event: 'error', data: { message: 'Not a participant' } };
      }

      const roomName = `conversation_${payload.conversationId}`;
      client.join(roomName);
      this.trackRoom(client, roomName);

      this.server.to(roomName).emit('user_joined', {
        userId: client.userId,
        conversationId: payload.conversationId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `User ${client.userId} joined conversation ${payload.conversationId}`,
      );

      return { event: 'joined_conversation', data: { conversationId: payload.conversationId } };
    } catch (error) {
      this.logger.error(`join_conversation error: ${error.message}`);
      return { event: 'error', data: { message: 'Failed to join conversation' } };
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinConversationPayload,
  ) {
    try {
      if (!client.userId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      const roomName = `conversation_${payload.conversationId}`;
      client.leave(roomName);
      this.untrackRoom(client, roomName);

      this.server.to(roomName).emit('user_left', {
        userId: client.userId,
        conversationId: payload.conversationId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `User ${client.userId} left conversation ${payload.conversationId}`,
      );

      return { event: 'left_conversation', data: { conversationId: payload.conversationId } };
    } catch (error) {
      this.logger.error(`leave_conversation error: ${error.message}`);
      return { event: 'error', data: { message: 'Failed to leave conversation' } };
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    try {
      if (!client.userId || !client.universityId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      if (!payload.conversationId || !payload.content?.trim()) {
        return { event: 'error', data: { message: 'conversationId and content are required' } };
      }

      if (payload.content.length > 10000) {
        return { event: 'error', data: { message: 'Message too long (max 10000 chars)' } };
      }

      const message = await this.messagingService.sendMessage(
        client.universityId,
        payload.conversationId,
        client.userId,
        {
          content: payload.content.trim(),
          type: payload.type as any,
          replyToId: payload.replyToId,
          fileUrl: payload.fileUrl,
          fileName: payload.fileName,
        },
      );

      const roomName = `conversation_${payload.conversationId}`;
      this.server.to(roomName).emit('receive_message', {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        status: message.status,
        createdAt: message.createdAt,
        replyToId: message.replyToId,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
      });

      this.server.to(`university_${client.universityId}`).emit('conversation_updated', {
        conversationId: payload.conversationId,
        lastMessagePreview: message.content.substring(0, 100),
        lastMessageAt: message.createdAt,
        senderId: client.userId,
      });

      return { event: 'message_sent', data: { id: message.id, createdAt: message.createdAt } };
    } catch (error) {
      this.logger.error(`send_message error: ${error.message}`);
      return { event: 'error', data: { message: error.message || 'Failed to send message' } };
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TypingPayload,
  ) {
    if (!client.userId || !payload.conversationId) return;

    const roomName = `conversation_${payload.conversationId}`;
    client.to(roomName).emit('typing_start', {
      userId: client.userId,
      conversationId: payload.conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TypingPayload,
  ) {
    if (!client.userId || !payload.conversationId) return;

    const roomName = `conversation_${payload.conversationId}`;
    client.to(roomName).emit('typing_stop', {
      userId: client.userId,
      conversationId: payload.conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('message_read')
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: MessageReadPayload,
  ) {
    try {
      if (!client.userId || !client.universityId) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }

      await this.messagingService.markAsRead(
        client.universityId,
        payload.conversationId,
        client.userId,
      );

      const roomName = `conversation_${payload.conversationId}`;
      client.to(roomName).emit('message_read', {
        userId: client.userId,
        conversationId: payload.conversationId,
        messageIds: payload.messageIds,
        readAt: new Date().toISOString(),
      });

      return { event: 'message_read_ack', data: { conversationId: payload.conversationId } };
    } catch (error) {
      this.logger.error(`message_read error: ${error.message}`);
      return { event: 'error', data: { message: 'Failed to mark as read' } };
    }
  }

  broadcastToUniversity(universityId: string, event: string, data: any) {
    this.server.to(`university_${universityId}`).emit(event, data);
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && (this.userSockets.get(userId)?.size ?? 0) > 0;
  }

  getOnlineUsers(universityId: string): string[] {
    const users = new Set<string>();
    const room = this.server.sockets?.adapter?.rooms?.get?.(`university_${universityId}`);
    if (room) {
      for (const socketId of room) {
        const socket = this.server.sockets?.sockets?.get?.(socketId) as AuthenticatedSocket | undefined;
        if (socket?.userId) {
          users.add(socket.userId);
        }
      }
    }
    return Array.from(users);
  }

  private trackConnection(client: AuthenticatedSocket) {
    if (!client.userId) return;

    if (!this.userSockets.has(client.userId)) {
      this.userSockets.set(client.userId, new Set());
    }
    this.userSockets.get(client.userId)!.add(client.id);

    if (!this.connectedUsers.has(client.universityId!)) {
      this.connectedUsers.set(client.universityId!, new Set());
    }
    this.connectedUsers.get(client.universityId!)!.add(client.userId);
  }

  private untrackConnection(client: AuthenticatedSocket) {
    if (!client.userId) return;

    const sockets = this.userSockets.get(client.userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(client.userId);
        if (client.universityId) {
          this.connectedUsers.get(client.universityId)?.delete(client.userId);
        }
      }
    }

    const rooms = this.socketRooms.get(client.id);
    if (rooms) {
      this.socketRooms.delete(client.id);
    }
  }

  private trackRoom(client: AuthenticatedSocket, room: string) {
    if (!this.socketRooms.has(client.id)) {
      this.socketRooms.set(client.id, new Set());
    }
    this.socketRooms.get(client.id)!.add(room);
  }

  private untrackRoom(client: AuthenticatedSocket, room: string) {
    this.socketRooms.get(client.id)?.delete(room);
  }
}
