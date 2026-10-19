import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Res,
} from '@nestjs/common';
import type { Response } from 'express';
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

  @Post('sessions/:id/messages/stream')
  @ApiOperation({ summary: 'Stream a tutor reply as Server-Sent Events (token by token)' })
  @ApiParam({ name: 'id', type: String })
  async streamMessage(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body('content') content: string,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    // Disable proxy buffering (Render/nginx) so tokens flush immediately.
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const send = (payload: Record<string, any>) => {
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch {
        // client disconnected mid-stream
      }
    };

    // Tell the client the stream is open so it can drop the "thinking" state.
    send({ type: 'ready' });

    try {
      const stream = await this.aiTutorService.streamMessage(
        universityId,
        id,
        userId,
        content,
      );
      for await (const chunk of stream) {
        if (chunk.text) send({ type: 'token', content: chunk.text });
        if (chunk.done) {
          send({ type: 'done', tokensUsed: chunk.tokensUsed ?? 0 });
          break;
        }
      }
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode;
      send({
        type: 'error',
        message: err?.message ?? 'The AI tutor is unavailable right now.',
        ...(status ? { status } : {}),
      });
    } finally {
      res.end();
    }
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
