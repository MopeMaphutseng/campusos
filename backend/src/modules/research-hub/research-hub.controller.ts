import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ResearchHubService } from './research-hub.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TargetedType } from '../targeting/targeted-type.decorator';

@ApiTags('Research Hub')
@Controller('research-hub')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class ResearchHubController {
  constructor(private researchHubService: ResearchHubService) {}

  @Post('calls')
  @ApiOperation({ summary: 'Create a research call' })
  async create(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.researchHubService.create(universityId, userId, body);
  }

  @Get('calls')
  @TargetedType('research')
  @ApiOperation({ summary: 'List research calls' })
  async findAll(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('department') department?: string,
  ) {
    return this.researchHubService.findAll(universityId, query, {
      type: type as any,
      status: status as any,
      department,
    });
  }

  @Get('calls/ai-matches')
  @ApiOperation({ summary: 'Get AI-matched research opportunities' })
  async getAiMatches(
    @UniversityId() universityId: string,
    @Query('skills') skills?: string,
    @Query('gpa') gpa?: number,
    @Query('yearOfStudy') yearOfStudy?: number,
    @Query('department') department?: string,
  ) {
    return this.researchHubService.getAiMatches(universityId, {
      skills: skills?.split(','),
      gpa: gpa ? Number(gpa) : undefined,
      yearOfStudy: yearOfStudy ? Number(yearOfStudy) : undefined,
      department,
    });
  }

  @Get('calls/mine')
  @ApiOperation({ summary: 'Get own research calls (supervisor)' })
  async getSupervisorCalls(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.researchHubService.getSupervisorCalls(universityId, userId);
  }

  @Get('calls/:id')
  @ApiOperation({ summary: 'Get research call by ID' })
  @ApiParam({ name: 'id', type: String })
  async findById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.researchHubService.findById(universityId, id);
  }

  @Patch('calls/:id')
  @ApiOperation({ summary: 'Update a research call' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.researchHubService.update(universityId, id, userId, body);
  }

  @Delete('calls/:id')
  @ApiOperation({ summary: 'Close a research call' })
  @ApiParam({ name: 'id', type: String })
  async delete(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    await this.researchHubService.delete(universityId, id, userId);
    return { success: true };
  }
}
