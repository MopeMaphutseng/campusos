import {
  Controller, Get, Post, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MentorshipService } from './mentorship.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { MentorStatus } from './entities/mentor-profile.entity';
import { TargetedType } from '../targeting/targeted-type.decorator';
import { BookingStatus } from './entities/booking.entity';

@ApiTags('Mentorship')
@Controller('mentorship')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class MentorshipController {
  constructor(private mentorshipService: MentorshipService) {}

  @Post('mentors')
  @ApiOperation({ summary: 'Create mentor profile' })
  async createMentorProfile(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.mentorshipService.createMentorProfile(universityId, userId, body);
  }

  @Get('mentors')
  @TargetedType('mentor')
  @ApiOperation({ summary: 'List mentors' })
  @ApiQuery({ name: 'status', required: false, enum: MentorStatus })
  async findMentors(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
    @Query('status') status?: MentorStatus,
  ) {
    return this.mentorshipService.findMentors(universityId, query, { status });
  }

  @Get('mentors/:id')
  @ApiOperation({ summary: 'Get mentor profile by ID' })
  @ApiParam({ name: 'id', type: String })
  async findMentorById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.mentorshipService.findMentorById(universityId, id);
  }

  @Patch('mentors/me')
  @ApiOperation({ summary: 'Update own mentor profile' })
  async updateMentorProfile(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.mentorshipService.updateMentorProfile(universityId, userId, body);
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Book a mentor session' })
  async bookMentor(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.mentorshipService.bookMentor(universityId, userId, body);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get user bookings' })
  async getUserBookings(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.mentorshipService.getUserBookings(universityId, userId);
  }

  @Patch('bookings/:id/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiParam({ name: 'id', type: String })
  async updateBookingStatus(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') bookingId: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.mentorshipService.updateBookingStatus(universityId, bookingId, userId, status);
  }

  @Get('mentors/:id/bookings')
  @ApiOperation({ summary: 'Get mentor bookings' })
  @ApiParam({ name: 'id', type: String })
  async getMentorBookings(
    @UniversityId() universityId: string,
    @Param('id') mentorId: string,
  ) {
    return this.mentorshipService.getMentorBookings(universityId, mentorId);
  }
}
