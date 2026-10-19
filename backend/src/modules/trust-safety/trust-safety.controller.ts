import {
  Controller, Get, Post, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TrustSafetyService } from './trust-safety.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ReportStatus, ReportCategory, ReportTargetType } from './entities/report.entity';

@ApiTags('Trust & Safety')
@Controller('trust-safety')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class TrustSafetyController {
  constructor(private trustSafetyService: TrustSafetyService) {}

  @Post('reports')
  @ApiOperation({ summary: 'Submit a report' })
  async createReport(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: {
      targetType: ReportTargetType;
      targetId: string;
      category: ReportCategory;
      reason: string;
      evidenceUrls?: string;
    },
  ) {
    return this.trustSafetyService.createReport(universityId, userId, body);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List reports' })
  async findReports(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
    @Query('status') status?: ReportStatus,
    @Query('category') category?: ReportCategory,
    @Query('targetType') targetType?: ReportTargetType,
  ) {
    return this.trustSafetyService.findReports(universityId, query, { status, category, targetType });
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiParam({ name: 'id', type: String })
  async findReportById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.trustSafetyService.findReportById(universityId, id);
  }

  @Patch('reports/:id/assign')
  @ApiOperation({ summary: 'Assign report to reviewer' })
  @ApiParam({ name: 'id', type: String })
  async assignReport(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.trustSafetyService.assignReport(universityId, id, userId);
  }

  @Patch('reports/:id/resolve')
  @ApiOperation({ summary: 'Resolve a report' })
  @ApiParam({ name: 'id', type: String })
  async resolveReport(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body('resolution') resolution: string,
  ) {
    return this.trustSafetyService.resolveReport(universityId, id, resolution);
  }

  @Patch('reports/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss a report' })
  @ApiParam({ name: 'id', type: String })
  async dismissReport(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.trustSafetyService.dismissReport(universityId, id, reason);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get report statistics' })
  async getReportStats(@UniversityId() universityId: string) {
    return this.trustSafetyService.getReportStats(universityId);
  }

  @Post('fraud-detection')
  @ApiOperation({ summary: 'Run fraud detection check' })
  async detectFraud(
    @UniversityId() universityId: string,
    @Body('targetType') targetType: string,
    @Body('targetId') targetId: string,
  ) {
    return this.trustSafetyService.detectFraud(universityId, targetType, targetId);
  }
}
