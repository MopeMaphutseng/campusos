import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlannerService } from './planner.service';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Planner')
@Controller('planner')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Post('study-roadmap')
  @ApiOperation({ summary: 'Generate a week-by-week study roadmap for a subject' })
  async studyRoadmap(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: { subject: string; weeks?: number; level?: string; hoursPerWeek?: number },
  ) {
    return this.plannerService.studyRoadmap(universityId, userId, body.subject, {
      weeks: body.weeks,
      level: body.level,
      hoursPerWeek: body.hoursPerWeek,
    });
  }

  @Post('exam-questions')
  @ApiOperation({ summary: 'Generate practice exam questions with answers for a topic' })
  async examQuestions(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: { topic: string; count?: number; difficulty?: string },
  ) {
    return this.plannerService.examQuestions(universityId, userId, body.topic, {
      count: body.count,
      difficulty: body.difficulty,
    });
  }

  @Post('business-plan')
  @ApiOperation({ summary: 'Draft a structured business plan from an idea' })
  async businessPlan(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: { idea: string; industry?: string; targetMarket?: string },
  ) {
    return this.plannerService.businessPlan(universityId, userId, body.idea, {
      industry: body.industry,
      targetMarket: body.targetMarket,
    });
  }

  @Post('pitch-deck')
  @ApiOperation({ summary: 'Generate a 10-slide pitch deck outline' })
  async pitchDeck(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: { business: string; audience?: string },
  ) {
    return this.plannerService.pitchDeck(universityId, userId, body.business, {
      audience: body.audience,
    });
  }
}
