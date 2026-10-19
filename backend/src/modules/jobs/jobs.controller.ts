import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { JobType, JobStatus } from './entities/job-listing.entity';
import { TargetedType } from '../targeting/targeted-type.decorator';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a job listing' })
  async create(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.jobsService.create(universityId, userId, body);
  }

  @Get()
  @TargetedType('job')
  @ApiOperation({ summary: 'List jobs' })
  @ApiQuery({ name: 'type', required: false, enum: JobType })
  @ApiQuery({ name: 'status', required: false, enum: JobStatus })
  @ApiQuery({ name: 'isRemote', required: false, type: Boolean })
  async findAll(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
    @Query('type') type?: JobType,
    @Query('status') status?: JobStatus,
    @Query('isRemote') isRemote?: boolean,
  ) {
    return this.jobsService.findAll(universityId, query, { type, status, isRemote });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiParam({ name: 'id', type: String })
  async findById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.jobsService.findById(universityId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a job listing' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.jobsService.update(universityId, id, userId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Close a job listing' })
  @ApiParam({ name: 'id', type: String })
  async delete(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    await this.jobsService.delete(universityId, id, userId);
    return { success: true };
  }

  @Post('cv-review')
  @ApiOperation({ summary: 'AI CV review' })
  async reviewCv(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: { education?: string; skills?: string[]; experience?: string },
  ) {
    return this.jobsService.reviewCv(universityId, userId, body);
  }
}
