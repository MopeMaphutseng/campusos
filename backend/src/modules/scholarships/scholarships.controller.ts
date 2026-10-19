import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ScholarshipsService } from './scholarships.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TargetedType } from '../targeting/targeted-type.decorator';

@ApiTags('Scholarships')
@Controller('scholarships')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class ScholarshipsController {
  constructor(private scholarshipsService: ScholarshipsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a scholarship' })
  async create(
    @UniversityId() universityId: string,
    @Body() body: any,
  ) {
    return this.scholarshipsService.create(universityId, body);
  }

  @Get()
  @TargetedType('scholarship')
  @ApiOperation({ summary: 'List scholarships' })
  async findAll(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.scholarshipsService.findAll(universityId, query, { status: status as any, type });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming deadline scholarships' })
  async getUpcoming(@UniversityId() universityId: string) {
    return this.scholarshipsService.getUpcomingDeadlines(universityId);
  }

  @Get('ai-matches')
  @ApiOperation({ summary: 'Get AI-matched scholarships for current user' })
  async getAiMatches(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Query('gpa') gpa?: number,
    @Query('yearOfStudy') yearOfStudy?: number,
    @Query('department') department?: string,
  ) {
    return this.scholarshipsService.getAiMatches(universityId, userId, {
      gpa: gpa ? Number(gpa) : undefined,
      yearOfStudy: yearOfStudy ? Number(yearOfStudy) : undefined,
      department,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scholarship by ID' })
  @ApiParam({ name: 'id', type: String })
  async findById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.scholarshipsService.findById(universityId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a scholarship' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.scholarshipsService.update(universityId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a scholarship' })
  @ApiParam({ name: 'id', type: String })
  async delete(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.scholarshipsService.delete(universityId, id);
    return { success: true };
  }
}
