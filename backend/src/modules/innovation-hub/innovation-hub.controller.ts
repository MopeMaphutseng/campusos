import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { InnovationHubService } from './innovation-hub.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Innovation Hub')
@Controller('innovation-hub')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class InnovationHubController {
  constructor(private innovationHubService: InnovationHubService) {}

  @Post('projects')
  @ApiOperation({ summary: 'Create a project' })
  async create(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.innovationHubService.create(universityId, userId, body);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List projects' })
  async findAll(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.innovationHubService.findAll(universityId, query, { status: status as any });
  }

  @Get('projects/featured')
  @ApiOperation({ summary: 'Get featured projects' })
  async getFeatured(@UniversityId() universityId: string) {
    return this.innovationHubService.getFeatured(universityId);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', type: String })
  async findById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.innovationHubService.findById(universityId, id);
  }

  @Patch('projects/:id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.innovationHubService.update(universityId, id, userId, body);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Archive a project' })
  @ApiParam({ name: 'id', type: String })
  async delete(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    await this.innovationHubService.delete(universityId, id, userId);
    return { success: true };
  }

  @Post('projects/:id/join')
  @ApiOperation({ summary: 'Join a project team' })
  @ApiParam({ name: 'id', type: String })
  async joinProject(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.innovationHubService.joinProject(universityId, id, userId);
  }

  @Delete('projects/:id/leave')
  @ApiOperation({ summary: 'Leave a project team' })
  @ApiParam({ name: 'id', type: String })
  async leaveProject(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.innovationHubService.leaveProject(universityId, id, userId);
  }

  @Post('projects/:id/star')
  @ApiOperation({ summary: 'Star a project' })
  @ApiParam({ name: 'id', type: String })
  async starProject(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.innovationHubService.starProject(universityId, id);
  }
}
