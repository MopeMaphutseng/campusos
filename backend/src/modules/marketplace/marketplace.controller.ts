import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('Marketplace')
@Controller('marketplace')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  @Post('listings')
  @ApiOperation({ summary: 'Create a marketplace listing' })
  async createListing(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.marketplaceService.createListing(universityId, userId, body);
  }

  @Get('listings')
  @ApiOperation({ summary: 'List marketplace items' })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  async findListings(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    return this.marketplaceService.findListings(universityId, query, { category, minPrice, maxPrice });
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get listing by ID' })
  @ApiParam({ name: 'id', type: String })
  async findListingById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.marketplaceService.findListingById(universityId, id);
  }

  @Patch('listings/:id')
  @ApiOperation({ summary: 'Update a listing' })
  @ApiParam({ name: 'id', type: String })
  async updateListing(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.marketplaceService.updateListing(universityId, id, userId, body);
  }

  @Delete('listings/:id')
  @ApiOperation({ summary: 'Delete a listing' })
  @ApiParam({ name: 'id', type: String })
  async deleteListing(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    await this.marketplaceService.deleteListing(universityId, id, userId);
    return { success: true };
  }

  @Patch('listings/:id/sold')
  @ApiOperation({ summary: 'Mark listing as sold' })
  @ApiParam({ name: 'id', type: String })
  async markAsSold(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.marketplaceService.markAsSold(universityId, id, userId);
  }

  @Post('reviews')
  @ApiOperation({ summary: 'Create a review' })
  async createReview(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.marketplaceService.createReview(universityId, userId, body);
  }

  @Get('reviews/user/:userId')
  @ApiOperation({ summary: 'Get reviews for a user' })
  @ApiParam({ name: 'userId', type: String })
  async findReviewsForUser(
    @UniversityId() universityId: string,
    @Param('userId') userId: string,
  ) {
    return this.marketplaceService.findReviewsForUser(universityId, userId);
  }

  @Post('listings/:id/flag')
  @ApiOperation({ summary: 'Flag a listing for review' })
  @ApiParam({ name: 'id', type: String })
  async flagListing(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.marketplaceService.flagListing(universityId, id);
    return { success: true };
  }
}
