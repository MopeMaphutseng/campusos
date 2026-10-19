import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Get profile, usage stats, goals and achievements for the current user' })
  async getAnalytics(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.profileService.getAnalytics(universityId, userId);
  }
}
