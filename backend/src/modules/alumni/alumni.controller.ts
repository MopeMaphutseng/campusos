import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AlumniService } from './alumni.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Alumni')
@Controller('alumni')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class AlumniController {
  constructor(private alumniService: AlumniService) {}

  @Post('profiles')
  @ApiOperation({ summary: 'Create alumni profile' })
  async createProfile(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.alumniService.createProfile(universityId, userId, body);
  }

  @Get('profiles')
  @ApiOperation({ summary: 'List alumni profiles' })
  @ApiQuery({ name: 'industry', required: false, type: String })
  @ApiQuery({ name: 'graduationYear', required: false, type: Number })
  @ApiQuery({ name: 'isMentor', required: false, type: Boolean })
  async findAll(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
    @Query('industry') industry?: string,
    @Query('graduationYear') graduationYear?: number,
    @Query('isMentor') isMentor?: boolean,
  ) {
    return this.alumniService.findAll(universityId, query, {
      industry,
      graduationYear: graduationYear ? Number(graduationYear) : undefined,
      isMentor,
    });
  }

  @Get('mentor-pool')
  @ApiOperation({ summary: 'Get available alumni mentors' })
  async findMentorPool(@UniversityId() universityId: string) {
    return this.alumniService.findMentorPool(universityId);
  }

  @Get('industries')
  @ApiOperation({ summary: 'Get alumni industry breakdown' })
  async getIndustries(@UniversityId() universityId: string) {
    return this.alumniService.getIndustries(universityId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get alumni statistics' })
  async getStatistics(@UniversityId() universityId: string) {
    return this.alumniService.getStatistics(universityId);
  }

  @Get('profiles/:id')
  @ApiOperation({ summary: 'Get alumni profile by ID' })
  @ApiParam({ name: 'id', type: String })
  async findById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.alumniService.findById(universityId, id);
  }

  @Patch('profiles/:id')
  @ApiOperation({ summary: 'Update alumni profile' })
  @ApiParam({ name: 'id', type: String })
  async updateProfile(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.alumniService.updateProfile(universityId, id, body);
  }

  @Delete('profiles/:id')
  @ApiOperation({ summary: 'Delete alumni profile' })
  @ApiParam({ name: 'id', type: String })
  async deleteProfile(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.alumniService.deleteProfile(universityId, id);
    return { success: true };
  }
}
