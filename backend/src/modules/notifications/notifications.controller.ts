import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService, NotificationTemplate } from './notifications.service';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async findUserNotifications(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.findUserNotifications(universityId, userId, unreadOnly);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    const count = await this.notificationsService.getUnreadCount(universityId, userId);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', type: String })
  async markAsRead(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(universityId, id, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    await this.notificationsService.markAllAsRead(universityId, userId);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', type: String })
  async deleteNotification(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    await this.notificationsService.deleteNotification(universityId, id, userId);
    return { success: true };
  }

  @Post('fcm-token')
  @ApiOperation({ summary: 'Register FCM token for push notifications' })
  async updateFcmToken(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: { token: string; platform?: string },
  ) {
    await this.notificationsService.registerFcmToken(
      universityId,
      userId,
      body.token,
      body.platform as any,
    );
    return { success: true };
  }

  @Delete('fcm-token/:token')
  @ApiOperation({ summary: 'Remove FCM token' })
  @ApiParam({ name: 'token', type: String })
  async removeFcmToken(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('token') token: string,
  ) {
    await this.notificationsService.removeFcmToken(universityId, userId, token);
    return { success: true };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.notificationsService.getNotificationPreferences(universityId, userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: Record<string, boolean>,
  ) {
    await this.notificationsService.updateNotificationPreferences(universityId, userId, body);
    return { success: true };
  }

  @Post('send-test')
  @ApiOperation({ summary: 'Send test push notification' })
  async sendTestPush(
    @UserId() userId: string,
    @Body() body: { token: string; title: string; body: string },
  ) {
    return this.notificationsService.sendPushNotification(body);
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Send university-wide broadcast notification' })
  async sendBroadcast(
    @UniversityId() universityId: string,
    @Body() body: { template: NotificationTemplate; data?: Record<string, unknown> },
  ) {
    return this.notificationsService.sendUniversityBroadcast(
      universityId,
      body.template,
      body.data,
    );
  }

  @Post('cleanup-tokens')
  @ApiOperation({ summary: 'Clean up stale FCM tokens' })
  async cleanupTokens(@Body('maxAgeDays') maxAgeDays?: number) {
    const cleaned = await this.notificationsService.cleanupStaleTokens(maxAgeDays);
    return { cleaned };
  }
}
