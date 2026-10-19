import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SportsService } from './sports.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SportType } from './entities/match.entity';

@ApiTags('Sports')
@Controller('sports')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class SportsController {
  constructor(private sportsService: SportsService) {}

  @Post('matches')
  @ApiOperation({ summary: 'Create a match' })
  async createMatch(
    @UniversityId() universityId: string,
    @Body() body: any,
  ) {
    return this.sportsService.createMatch(universityId, body);
  }

  @Get('matches')
  @ApiOperation({ summary: 'List matches' })
  async findAll(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
    @Query('sport') sport?: SportType,
    @Query('status') status?: string,
    @Query('league') league?: string,
  ) {
    return this.sportsService.findAll(universityId, query, { sport, status: status as any, league });
  }

  @Get('matches/live')
  @ApiOperation({ summary: 'Get live matches' })
  async getLiveMatches(@UniversityId() universityId: string) {
    return this.sportsService.getLiveMatches(universityId);
  }

  @Get('matches/upcoming')
  @ApiOperation({ summary: 'Get upcoming matches' })
  async getUpcomingMatches(@UniversityId() universityId: string) {
    return this.sportsService.getUpcomingMatches(universityId);
  }

  @Get('matches/:id')
  @ApiOperation({ summary: 'Get match by ID' })
  @ApiParam({ name: 'id', type: String })
  async findById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.sportsService.findById(universityId, id);
  }

  @Patch('matches/:id')
  @ApiOperation({ summary: 'Update a match' })
  @ApiParam({ name: 'id', type: String })
  async updateMatch(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.sportsService.updateMatch(universityId, id, userId, body);
  }

  @Patch('matches/:id/start')
  @ApiOperation({ summary: 'Start a match' })
  @ApiParam({ name: 'id', type: String })
  async startMatch(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.sportsService.startMatch(universityId, id);
  }

  @Patch('matches/:id/score')
  @ApiOperation({ summary: 'Update match score' })
  @ApiParam({ name: 'id', type: String })
  async updateScore(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body('homeScore') homeScore: number,
    @Body('awayScore') awayScore: number,
  ) {
    return this.sportsService.updateScore(universityId, id, homeScore, awayScore);
  }

  @Patch('matches/:id/complete')
  @ApiOperation({ summary: 'Complete a match' })
  @ApiParam({ name: 'id', type: String })
  async completeMatch(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.sportsService.completeMatch(universityId, id);
  }

  @Delete('matches/:id')
  @ApiOperation({ summary: 'Cancel a match' })
  @ApiParam({ name: 'id', type: String })
  async deleteMatch(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.sportsService.deleteMatch(universityId, id);
    return { success: true };
  }

  @Post('matches/:id/events')
  @ApiOperation({ summary: 'Add a live event to a match' })
  @ApiParam({ name: 'id', type: String })
  async addLiveEvent(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: { minute: number; type: string; description: string; team: string },
  ) {
    return this.sportsService.addLiveEvent(universityId, id, body);
  }
}
