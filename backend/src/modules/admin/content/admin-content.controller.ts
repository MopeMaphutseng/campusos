import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { UniversityId, UserId } from '../../../common/decorators/auth.decorators';
import { AdminContentService } from './admin-content.service';

@ApiTags('Admin Content')
@Controller('admin/content')
@UseGuards(AuthGuard('jwt'), TenantGuard, AdminGuard)
@ApiBearerAuth()
export class AdminContentController {
  constructor(private readonly content: AdminContentService) {}

  @Get(':type')
  @ApiOperation({ summary: 'List all content of a type (admin view, includes targeting)' })
  @ApiParam({ name: 'type', enum: ['library', 'scholarship', 'job', 'research', 'location', 'news', 'seminar', 'mentor'] })
  list(@UniversityId() universityId: string, @Param('type') type: string) {
    return this.content.list(type, universityId);
  }

  @Post(':type')
  @ApiOperation({ summary: 'Create content (admin); optional targetCourseCodes to target students' })
  @ApiParam({ name: 'type', enum: ['library', 'scholarship', 'job', 'research', 'location', 'news', 'seminar', 'mentor'] })
  create(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('type') type: string,
    @Body() body: any,
  ) {
    return this.content.create(type, universityId, userId, body);
  }

  @Patch(':type/:id')
  @ApiOperation({ summary: 'Update content (admin)' })
  update(
    @UniversityId() universityId: string,
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.content.update(type, universityId, id, body);
  }

  @Delete(':type/:id')
  @ApiOperation({ summary: 'Delete content (admin, soft delete)' })
  remove(
    @UniversityId() universityId: string,
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.content.remove(type, universityId, id);
  }
}
