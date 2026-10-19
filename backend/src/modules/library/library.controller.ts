import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LibraryService } from './library.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { LibraryItemType } from './entities/library-item.entity';
import { TargetedType } from '../targeting/targeted-type.decorator';

@ApiTags('Library')
@Controller('library')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Post('items')
  @ApiOperation({ summary: 'Create a library item' })
  async createItem(
    @UniversityId() universityId: string,
    @Body() body: any,
  ) {
    return this.libraryService.createItem(universityId, body);
  }

  @Get('items')
  @TargetedType('library')
  @ApiOperation({ summary: 'List library items' })
  @ApiQuery({ name: 'faculty', required: false, type: String })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: LibraryItemType })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  async findItems(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
    @Query('faculty') faculty?: string,
    @Query('courseId') courseId?: string,
    @Query('type') type?: LibraryItemType,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.libraryService.findItems(universityId, query, { faculty, courseId, type, categoryId });
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get library item by ID' })
  @ApiParam({ name: 'id', type: String })
  async findItemById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.libraryService.findItemById(universityId, id);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a library item' })
  @ApiParam({ name: 'id', type: String })
  async updateItem(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.libraryService.updateItem(universityId, id, body);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete a library item' })
  @ApiParam({ name: 'id', type: String })
  async deleteItem(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.libraryService.deleteItem(universityId, id);
    return { success: true };
  }

  @Post('items/:id/vote')
  @ApiOperation({ summary: 'Vote on a library item' })
  @ApiParam({ name: 'id', type: String })
  async voteItem(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body('direction') direction: 'up' | 'down',
  ) {
    return this.libraryService.voteItem(universityId, id, direction);
  }

  @Post('items/:id/ai/explain')
  @ApiOperation({ summary: 'AI explainer for a library item' })
  @ApiParam({ name: 'id', type: String })
  async aiExplain(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.libraryService.generateAiExplainer(universityId, userId, id);
  }

  @Post('items/:id/ai/summarize')
  @ApiOperation({ summary: 'AI summarize a library item' })
  @ApiParam({ name: 'id', type: String })
  async aiSummarize(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.libraryService.generateAiSummary(universityId, userId, id);
  }

  @Post('items/:id/ai/flashcards')
  @ApiOperation({ summary: 'Generate flashcards from a library item' })
  @ApiParam({ name: 'id', type: String })
  async aiFlashcards(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.libraryService.generateFlashcards(universityId, userId, id);
  }

  @Post('items/:id/ai/citation')
  @ApiOperation({ summary: 'Generate citation for a library item' })
  @ApiParam({ name: 'id', type: String })
  async aiCitation(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body('format') format: string,
  ) {
    return this.libraryService.generateCitation(universityId, userId, id, format);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a library category' })
  async createCategory(
    @UniversityId() universityId: string,
    @Body() body: any,
  ) {
    return this.libraryService.createCategory(universityId, body);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List library categories' })
  async findCategories(@UniversityId() universityId: string) {
    return this.libraryService.findCategories(universityId);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', type: String })
  async updateCategory(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.libraryService.updateCategory(universityId, id, body);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', type: String })
  async deleteCategory(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.libraryService.deleteCategory(universityId, id);
    return { success: true };
  }
}
