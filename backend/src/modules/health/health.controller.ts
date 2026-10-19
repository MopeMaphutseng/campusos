import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { HealthAppointmentStatus } from './entities/health-appointment.entity';

@ApiTags('Health')
@Controller('health')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Post('appointments')
  @ApiOperation({ summary: 'Book a health appointment' })
  async bookAppointment(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.healthService.bookAppointment(universityId, userId, body);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Get own health appointments' })
  async findUserAppointments(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.healthService.findUserAppointments(universityId, userId);
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiParam({ name: 'id', type: String })
  async findAppointmentById(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.healthService.findAppointmentById(universityId, id, userId);
  }

  @Patch('appointments/:id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiParam({ name: 'id', type: String })
  async cancelAppointment(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.healthService.cancelAppointment(universityId, id, userId);
  }

  @Patch('appointments/:id/status')
  @ApiOperation({ summary: 'Update appointment status (provider)' })
  @ApiParam({ name: 'id', type: String })
  async updateAppointmentStatus(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body('status') status: HealthAppointmentStatus,
  ) {
    return this.healthService.updateAppointmentStatus(universityId, id, status);
  }

  @Get('appointments/slots')
  @ApiOperation({ summary: 'Get available appointment slots' })
  async getAvailableSlots(
    @UniversityId() universityId: string,
    @Query('date') date: string,
  ) {
    return this.healthService.getAvailableSlots(universityId, date);
  }

  @Post('emergency/sos')
  @ApiOperation({ summary: 'Trigger emergency SOS' })
  async triggerEmergencySos(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: { latitude?: number; longitude?: number; message?: string },
  ) {
    return this.healthService.triggerEmergencySos(universityId, userId, body);
  }

  @Get('safety-alerts')
  @ApiOperation({ summary: 'Get current safety alerts' })
  async getSafetyAlerts(@UniversityId() universityId: string) {
    return this.healthService.getSafetyAlerts(universityId);
  }
}
