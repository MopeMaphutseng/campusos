import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Messaging')
@Controller('messaging')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a conversation' })
  async createConversation(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: { type: string; name?: string; participantIds: string[] },
  ) {
    return this.messagingService.createConversation(universityId, userId, {
      type: body.type as any,
      name: body.name,
      participantIds: body.participantIds,
    });
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  async getUserConversations(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.messagingService.getUserConversations(universityId, userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiParam({ name: 'id', type: String })
  async getConversationById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.messagingService.getConversationById(universityId, id);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiParam({ name: 'id', type: String })
  async sendMessage(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() body: { content: string; replyToId?: string; fileUrl?: string },
  ) {
    return this.messagingService.sendMessage(universityId, id, userId, body);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiParam({ name: 'id', type: String })
  async getConversationMessages(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Query() query: PaginationDto,
  ) {
    return this.messagingService.getConversationMessages(universityId, id, userId, query);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  @ApiParam({ name: 'id', type: String })
  async markAsRead(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    await this.messagingService.markAsRead(universityId, id, userId);
    return { success: true };
  }

  @Patch('messages/:id')
  @ApiOperation({ summary: 'Edit a message' })
  @ApiParam({ name: 'id', type: String })
  async editMessage(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.messagingService.editMessage(universityId, id, userId, content);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'id', type: String })
  async deleteMessage(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    await this.messagingService.deleteMessage(universityId, id, userId);
    return { success: true };
  }
}
