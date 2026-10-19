import { Controller, Get, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SeminarService } from './seminar.service';
import { SeminarType, SeminarStatus } from './entities/seminar.entity';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TargetedType } from '../targeting/targeted-type.decorator';

@Controller('seminars')
@UseGuards(AuthGuard('jwt'), TenantGuard)
export class SeminarController {
  constructor(private readonly seminarService: SeminarService) {}

  @Get()
  @TargetedType('seminar')
  async findAll(
    @Headers('X-University-ID') universityId: string,
    @Query('type') type?: SeminarType,
    @Query('status') status?: SeminarStatus,
    @Query('featured') featured?: string,
    @Query('upcoming') upcoming?: string,
  ) {
    return this.seminarService.findAll(universityId, {
      type,
      status,
      featured: featured === 'true',
      upcoming: upcoming === 'true',
    });
  }

  @Get('types')
  async getTypes() {
    return this.seminarService.getTypes();
  }

  @Get(':id')
  async findById(
    @Headers('X-University-ID') universityId: string,
    @Param('id') id: string,
  ) {
    return this.seminarService.findById(universityId, id);
  }
}
