import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AiTutorService } from './ai-tutor.service';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TutorMode, IntegrityMode } from './entities/tutor-session.entity';

@ApiTags('AI Tutor')
@Controller('ai-tutor')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class AiTutorController {
  constructor(private aiTutorService: AiTutorService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new tutor session' })
  async createSession(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: {
      courseId?: string;
      courseCode?: string;
      mode?: TutorMode;
      integrityMode?: IntegrityMode;
    },
  ) {
    return this.aiTutorService.createSession(universityId, userId, body);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get user tutor sessions' })
  async getSessions(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.aiTutorService.getSessions(universityId, userId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiParam({ name: 'id', type: String })
  async getSessionById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.aiTutorService.getSessionById(universityId, id);
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'Send a message in a session' })
  @ApiParam({ name: 'id', type: String })
  async sendMessage(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.aiTutorService.sendMessage(universityId, id, userId, content);
  }

  @Patch('sessions/:id/end')
  @ApiOperation({ summary: 'End a tutor session' })
  @ApiParam({ name: 'id', type: String })
  async endSession(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.aiTutorService.endSession(universityId, id, userId);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete a tutor session' })
  @ApiParam({ name: 'id', type: String })
  async deleteSession(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    await this.aiTutorService.deleteSession(universityId, id, userId);
    return { success: true };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get tutor usage stats' })
  async getSessionStats(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.aiTutorService.getSessionStats(universityId, userId);
  }
}
