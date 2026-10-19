import {
  Controller, Get, Post, Query, Body, Param, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UniversityId, UserId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('events')
  @ApiOperation({ summary: 'Track an analytics event' })
  async trackEvent(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.adminService.trackEvent({ ...body, universityId, userId });
  }

  @Get('analytics/module-usage')
  @ApiOperation({ summary: 'Get module usage analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'year'] })
  async getModuleUsage(
    @UniversityId() universityId: string,
    @Query('period') period: string,
  ) {
    return this.adminService.getModuleUsage(universityId, period || 'month');
  }

  @Get('analytics/user-activity')
  @ApiOperation({ summary: 'Get user activity over time' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'year'] })
  async getUserActivity(
    @UniversityId() universityId: string,
    @Query('period') period: string,
  ) {
    return this.adminService.getUserActivity(universityId, period || 'month');
  }

  @Get('analytics/growth')
  @ApiOperation({ summary: 'Get growth metrics' })
  async getGrowthMetrics(@UniversityId() universityId: string) {
    return this.adminService.getGrowthMetrics(universityId);
  }

  @Get('reports/:type')
  @ApiOperation({ summary: 'Generate a report' })
  async getReport(
    @UniversityId() universityId: string,
    @Param('type') type: string,
    @Query() query: PaginationDto,
  ) {
    return this.adminService.getReport(universityId, type, query);
  }

  @Post('export/:module')
  @ApiOperation({ summary: 'Export data for a module' })
  async exportData(
    @UniversityId() universityId: string,
    @Param('module') module: string,
    @Body('format') format: string,
  ) {
    return this.adminService.exportData(universityId, module, format || 'csv');
  }
}
