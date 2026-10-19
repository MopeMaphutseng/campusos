import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { NewsCategory } from './entities/news-article.entity';
import { TargetedType } from '../targeting/targeted-type.decorator';

@ApiTags('News & Startup Hub')
@Controller('news')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class NewsController {
  constructor(private newsService: NewsService) {}

  @Post('articles')
  @ApiOperation({ summary: 'Create a news article' })
  async createArticle(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.newsService.createArticle(universityId, userId, body);
  }

  @Get('articles')
  @TargetedType('news')
  @ApiOperation({ summary: 'List news articles' })
  @ApiQuery({ name: 'category', required: false, enum: NewsCategory })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getArticles(
    @UniversityId() universityId: string,
    @Query('category') category?: NewsCategory,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.newsService.getArticles(universityId, category, page || 1, limit || 20);
  }

  @Get('articles/:id')
  @ApiOperation({ summary: 'Get article by ID' })
  @ApiParam({ name: 'id', type: String })
  async getArticleById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.newsService.getArticleById(universityId, id);
  }

  @Patch('articles/:id')
  @ApiOperation({ summary: 'Update an article' })
  @ApiParam({ name: 'id', type: String })
  async updateArticle(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.newsService.updateArticle(universityId, id, body);
  }

  @Delete('articles/:id')
  @ApiOperation({ summary: 'Delete an article' })
  @ApiParam({ name: 'id', type: String })
  async deleteArticle(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.newsService.deleteArticle(universityId, id);
    return { success: true };
  }

  @Post('startups')
  @ApiOperation({ summary: 'Create a startup hub entry' })
  async createStartup(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.newsService.createStartup(universityId, userId, body);
  }

  @Get('startups')
  @ApiOperation({ summary: 'List startups' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getStartups(
    @UniversityId() universityId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.newsService.getStartups(universityId, page || 1, limit || 20);
  }

  @Get('startups/:id')
  @ApiOperation({ summary: 'Get startup by ID' })
  @ApiParam({ name: 'id', type: String })
  async getStartupById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.newsService.getStartupById(universityId, id);
  }

  @Patch('startups/:id')
  @ApiOperation({ summary: 'Update a startup' })
  @ApiParam({ name: 'id', type: String })
  async updateStartup(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.newsService.updateStartup(universityId, id, body);
  }
}
