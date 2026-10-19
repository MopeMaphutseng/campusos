import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AcademicsService } from './academics.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { DayOfWeek } from './entities/timetable.entity';

@ApiTags('Academics')
@Controller('academics')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class AcademicsController {
  constructor(private academicsService: AcademicsService) {}

  @Post('courses')
  @ApiOperation({ summary: 'Create a new course' })
  async createCourse(
    @UniversityId() universityId: string,
    @Body() body: any,
  ) {
    return this.academicsService.createCourse(universityId, body);
  }

  @Get('courses')
  @ApiOperation({ summary: 'List courses' })
  async findCourses(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
  ) {
    return this.academicsService.findCourses(universityId, query);
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', type: String })
  async findCourseById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.academicsService.findCourseById(universityId, id);
  }

  @Patch('courses/:id')
  @ApiOperation({ summary: 'Update a course' })
  @ApiParam({ name: 'id', type: String })
  async updateCourse(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.academicsService.updateCourse(universityId, id, body);
  }

  @Delete('courses/:id')
  @ApiOperation({ summary: 'Delete a course' })
  @ApiParam({ name: 'id', type: String })
  async deleteCourse(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.academicsService.deleteCourse(universityId, id);
    return { success: true };
  }

  @Get('timetable')
  @ApiOperation({ summary: 'Get timetable entries' })
  @ApiQuery({ name: 'day', required: false, enum: DayOfWeek })
  async getTimetable(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Query('day') day?: DayOfWeek,
  ) {
    return this.academicsService.getTimetable(universityId, userId, day);
  }

  @Post('timetable')
  @ApiOperation({ summary: 'Add timetable entry' })
  async addTimetableEntry(
    @UniversityId() universityId: string,
    @Body() body: any,
  ) {
    return this.academicsService.addTimetableEntry(universityId, body);
  }

  @Patch('timetable/:id')
  @ApiOperation({ summary: 'Update timetable entry' })
  @ApiParam({ name: 'id', type: String })
  async updateTimetableEntry(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.academicsService.updateTimetableEntry(universityId, id, body);
  }

  @Delete('timetable/:id')
  @ApiOperation({ summary: 'Delete timetable entry' })
  @ApiParam({ name: 'id', type: String })
  async deleteTimetableEntry(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.academicsService.deleteTimetableEntry(universityId, id);
    return { success: true };
  }

  @Post('enroll')
  @ApiOperation({ summary: 'Enroll in a course' })
  async enroll(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body('courseId') courseId: string,
    @Body('section') section?: string,
  ) {
    return this.academicsService.enroll(universityId, userId, courseId, section);
  }

  @Delete('enroll/:courseId')
  @ApiOperation({ summary: 'Drop enrollment from a course' })
  @ApiParam({ name: 'courseId', type: String })
  async dropEnrollment(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.academicsService.dropEnrollment(universityId, userId, courseId);
  }

  @Get('enrollments')
  @ApiOperation({ summary: 'Get user enrollments' })
  async getUserEnrollments(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.academicsService.getUserEnrollments(universityId, userId);
  }

  @Get('courses/:courseId/enrollments')
  @ApiOperation({ summary: 'Get course enrollments' })
  @ApiParam({ name: 'courseId', type: String })
  async getCourseEnrollments(
    @UniversityId() universityId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.academicsService.getCourseEnrollments(universityId, courseId);
  }
}
