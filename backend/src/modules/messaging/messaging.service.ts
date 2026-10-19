import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, ConversationType } from './entities/conversation.entity';
import { Message, MessageType, MessageStatus } from './entities/message.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Conversation) private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
  ) {}

  async createConversation(universityId: string, creatorId: string, data: {
    type: ConversationType;
    name?: string;
    participantIds: string[];
  }): Promise<Conversation> {
    const allParticipants = [...new Set([creatorId, ...data.participantIds])];
    const conversation = this.conversationRepo.create({
      universityId,
      type: data.type,
      name: data.name,
      participantIds: allParticipants,
      createdBy: creatorId,
    });
    return this.conversationRepo.save(conversation);
  }

  async getUserConversations(universityId: string, userId: string): Promise<Conversation[]> {
    return this.conversationRepo
      .createQueryBuilder('c')
      .where('c.universityId = :universityId', { universityId })
      .andWhere(':userId::text IN (SELECT jsonb_array_elements_text(c."participant_ids"))', { userId })
      .orderBy('c.lastMessageAt', 'DESC')
      .getMany();
  }

  async getConversationById(universityId: string, id: string): Promise<Conversation> {
    const conversation = await this.conversationRepo.findOne({ where: { id, universityId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async sendMessage(universityId: string, conversationId: string, senderId: string, data: {
    content: string;
    type?: MessageType;
    replyToId?: string;
    fileUrl?: string;
    fileName?: string;
  }): Promise<Message> {
    const conversation = await this.getConversationById(universityId, conversationId);
    if (!conversation.participantIds.includes(senderId)) {
      throw new ForbiddenException('Not a participant');
    }

    const message = this.messageRepo.create({
      universityId,
      conversationId,
      senderId,
      type: data.type || MessageType.TEXT,
      content: data.content,
      replyToId: data.replyToId,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
    });

    const saved = await this.messageRepo.save(message);

    conversation.lastMessagePreview = data.content.substring(0, 100);
    conversation.lastMessageAt = new Date();
    await this.conversationRepo.save(conversation);

    return saved;
  }

  async getConversationMessages(
    universityId: string,
    conversationId: string,
    userId: string,
    query: PaginationDto,
  ): Promise<PaginatedResult<Message>> {
    const conversation = await this.getConversationById(universityId, conversationId);
    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('Not a participant');
    }

    const qb = this.messageRepo.createQueryBuilder('m')
      .where('m.conversationId = :conversationId', { conversationId })
      .andWhere('m.status != :deleted', { deleted: MessageStatus.DELETED });

    if (query.search) {
      qb.andWhere('m.content ILIKE :search', { search: `%${query.search}%` });
    }

    const [items, total] = await qb
      .orderBy('m.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async markAsRead(universityId: string, conversationId: string, userId: string): Promise<void> {
    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ status: MessageStatus.READ })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('status != :read', { read: MessageStatus.READ })
      .execute();
  }

  async deleteMessage(universityId: string, messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepo.findOne({ where: { id: messageId, universityId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Not your message');
    message.status = MessageStatus.DELETED;
    await this.messageRepo.save(message);
  }

  async editMessage(universityId: string, messageId: string, userId: string, content: string): Promise<Message> {
    const message = await this.messageRepo.findOne({ where: { id: messageId, universityId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Not your message');
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    return this.messageRepo.save(message);
  }
}
