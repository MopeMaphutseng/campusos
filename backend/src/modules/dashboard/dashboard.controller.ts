import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('today')
  @ApiOperation({ summary: 'Get personalized Today dashboard' })
  async getTodayDashboard(
    @UserId() userId: string,
    @UniversityId() universityId: string,
  ) {
    return this.dashboardService.getTodayDashboard(userId, universityId);
  }
}
