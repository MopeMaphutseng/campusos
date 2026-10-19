import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService } from './tenants.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List all universities (public)' })
  async list(@Query() query: PaginationDto) {
    return this.tenantsService.list(query.page, query.limit);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get university by slug (public)' })
  async findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Get(':id/modules')
  @ApiOperation({ summary: 'Get enabled modules for university' })
  async getModules(@Param('id') id: string) {
    return this.tenantsService.getEnabledModules(id);
  }

  @Patch(':id/modules/:moduleKey')
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle module for university (admin)' })
  async toggleModule(
    @Param('id') id: string,
    @Param('moduleKey') moduleKey: string,
    @Body('enabled') enabled: boolean,
    @UniversityId() universityId: string,
  ) {
    if (id !== universityId) {
      throw new ForbiddenException('Cannot modify another university');
    }
    return this.tenantsService.toggleModule(id, moduleKey, enabled);
  }
}
