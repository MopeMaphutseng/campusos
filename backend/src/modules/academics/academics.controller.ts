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

  @Get('materials')
  @ApiOperation({ summary: 'List study materials for the current user’s enrolled courses' })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getMyMaterials(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Query('courseId') courseId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.academicsService.getMyMaterials(universityId, userId, {
      courseId,
      category,
      search,
    });
  }

  @Get('courses/:courseId/materials')
  @ApiOperation({ summary: 'List study materials for a course' })
  @ApiParam({ name: 'courseId', type: String })
  async getCourseMaterials(
    @UniversityId() universityId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.academicsService.getCourseMaterials(universityId, courseId);
  }

  @Post('materials')
  @ApiOperation({ summary: 'Add a study material record' })
  async createMaterial(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.academicsService.createMaterial(universityId, userId, body);
  }

  @Post('materials/:id/download')
  @ApiOperation({ summary: 'Record a material download/view' })
  @ApiParam({ name: 'id', type: String })
  async recordMaterialDownload(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.academicsService.recordMaterialDownload(universityId, id);
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

  @Get('timetable/my')
  @ApiOperation({ summary: 'Get personal timetable for current user' })
  @ApiQuery({ name: 'day', required: false, enum: DayOfWeek })
  async getMyTimetable(
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

  @Get('enrollments/:enrollmentId/grades')
  @ApiOperation({ summary: 'Get grade item breakdown for an enrollment' })
  @ApiParam({ name: 'enrollmentId', type: String })
  async getGradeItems(
    @UniversityId() universityId: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    return this.academicsService.getGradeItems(universityId, enrollmentId);
  }

  @Post('enrollments/:enrollmentId/grades')
  @ApiOperation({ summary: 'Add a grade item to an enrollment' })
  @ApiParam({ name: 'enrollmentId', type: String })
  async addGradeItem(
    @UniversityId() universityId: string,
    @Param('enrollmentId') enrollmentId: string,
    @Body() body: any,
  ) {
    return this.academicsService.addGradeItem(universityId, {
      ...body,
      enrollmentId,
    });
  }

  @Patch('grades/:id')
  @ApiOperation({ summary: 'Update a grade item' })
  @ApiParam({ name: 'id', type: String })
  async updateGradeItem(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.academicsService.updateGradeItem(universityId, id, body);
  }

  @Delete('grades/:id')
  @ApiOperation({ summary: 'Delete a grade item' })
  @ApiParam({ name: 'id', type: String })
  async deleteGradeItem(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.academicsService.deleteGradeItem(universityId, id);
    return { success: true };
  }

  @Get('performance/summary')
  @ApiOperation({ summary: 'Get GPA and academic performance summary for current user' })
  async getPerformanceSummary(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.academicsService.getPerformanceSummary(universityId, userId);
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
