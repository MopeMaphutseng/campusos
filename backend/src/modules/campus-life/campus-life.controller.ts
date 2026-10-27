import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CampusLifeService } from './campus-life.service';
import { UserId, UniversityId } from '../../common/decorators/auth.decorators';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { MapLocationType } from './entities/campus-map.entity';
import { CafeteriaOrderStatus } from './entities/cafeteria-order.entity';
import { MealType } from './entities/cafeteria-menu.entity';
import { TargetedType } from '../targeting/targeted-type.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ClubCategory } from './entities/club.entity';

@ApiTags('Campus Life')
@Controller('campus-life')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class CampusLifeController {
  constructor(private campusLifeService: CampusLifeService) {}

  // --- Map Locations ---

  @Post('map/locations')
  @ApiOperation({ summary: 'Add a campus map location' })
  async createMapLocation(
    @UniversityId() universityId: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.createMapLocation(universityId, body);
  }

  @Get('map/locations')
  @TargetedType('location')
  @ApiOperation({ summary: 'Get campus map locations' })
  @ApiQuery({ name: 'type', required: false, enum: MapLocationType })
  async findMapLocations(
    @UniversityId() universityId: string,
    @Query('type') type?: MapLocationType,
  ) {
    return this.campusLifeService.findMapLocations(universityId, type);
  }

  @Patch('map/locations/:id')
  @ApiOperation({ summary: 'Update a map location' })
  @ApiParam({ name: 'id', type: String })
  async updateMapLocation(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.updateMapLocation(universityId, id, body);
  }

  @Delete('map/locations/:id')
  @ApiOperation({ summary: 'Remove a map location' })
  @ApiParam({ name: 'id', type: String })
  async deleteMapLocation(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.campusLifeService.deleteMapLocation(universityId, id);
    return { success: true };
  }

  // --- Cafeteria ---

  @Post('cafeteria/orders')
  @ApiOperation({ summary: 'Place a cafeteria order' })
  async createCafeteriaOrder(
    @UniversityId() universityId: string,
    @UserId() userId: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.createCafeteriaOrder(universityId, userId, body);
  }

  @Get('cafeteria/orders')
  @ApiOperation({ summary: 'Get own cafeteria orders' })
  async findCafeteriaOrders(
    @UniversityId() universityId: string,
    @UserId() userId: string,
  ) {
    return this.campusLifeService.findCafeteriaOrders(universityId, userId);
  }

  @Patch('cafeteria/orders/:id/status')
  @ApiOperation({ summary: 'Update cafeteria order status' })
  @ApiParam({ name: 'id', type: String })
  async updateOrderStatus(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body('status') status: CafeteriaOrderStatus,
  ) {
    return this.campusLifeService.updateOrderStatus(universityId, id, status);
  }

  // --- Cafeteria daily menu ---

  @Get('cafeteria/menu')
  @ApiOperation({ summary: 'Get the cafeteria menu for a day (defaults to today)' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'mealType', required: false, enum: MealType })
  @ApiQuery({ name: 'shopId', required: false, type: String })
  async findDailyMenu(
    @UniversityId() universityId: string,
    @Query('date') date?: string,
    @Query('mealType') mealType?: MealType,
    @Query('shopId') shopId?: string,
  ) {
    return this.campusLifeService.findDailyMenu(universityId, date, mealType, shopId);
  }

  @Get('cafeteria/menu/week')
  @ApiOperation({ summary: 'Get the cafeteria menu for the coming week' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'YYYY-MM-DD' })
  async findWeeklyMenu(
    @UniversityId() universityId: string,
    @Query('startDate') startDate?: string,
  ) {
    return this.campusLifeService.findWeeklyMenu(universityId, startDate);
  }

  @Post('cafeteria/menu')
  @ApiOperation({ summary: 'Create a cafeteria menu item' })
  async createMenuItem(
    @UniversityId() universityId: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.createMenuItem(universityId, body);
  }

  @Patch('cafeteria/menu/:id')
  @ApiOperation({ summary: 'Update a cafeteria menu item' })
  @ApiParam({ name: 'id', type: String })
  async updateMenuItem(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.updateMenuItem(universityId, id, body);
  }

  @Delete('cafeteria/menu/:id')
  @ApiOperation({ summary: 'Delete a cafeteria menu item' })
  @ApiParam({ name: 'id', type: String })
  async deleteMenuItem(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.campusLifeService.deleteMenuItem(universityId, id);
    return { success: true };
  }

  // --- Hostels ---

  @Get('hostels')
  @ApiOperation({ summary: 'List hostels' })
  async findHostels(@UniversityId() universityId: string) {
    return this.campusLifeService.findHostels(universityId);
  }

  @Get('hostels/available')
  @ApiOperation({ summary: 'List available hostels' })
  async findAvailableHostels(@UniversityId() universityId: string) {
    return this.campusLifeService.findAvailableHostels(universityId);
  }

  @Get('hostels/:id')
  @ApiOperation({ summary: 'Get hostel details' })
  @ApiParam({ name: 'id', type: String })
  async findHostelById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.campusLifeService.findHostelById(universityId, id);
  }

  @Post('hostels')
  @ApiOperation({ summary: 'Create a hostel' })
  async createHostel(
    @UniversityId() universityId: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.createHostel(universityId, body);
  }

  @Patch('hostels/:id')
  @ApiOperation({ summary: 'Update a hostel' })
  @ApiParam({ name: 'id', type: String })
  async updateHostel(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.updateHostel(universityId, id, body);
  }

  // --- Clubs ---

  @Post('clubs')
  @ApiOperation({ summary: 'Create a club' })
  async createClub(
    @UniversityId() universityId: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.createClub(universityId, body);
  }

  @Get('clubs')
  @ApiOperation({ summary: 'List campus clubs' })
  @ApiQuery({ name: 'category', required: false, enum: ClubCategory })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findClubs(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
    @Query('category') category?: ClubCategory,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.campusLifeService.findClubs(universityId, query, {
      category,
      isActive,
    });
  }

  @Get('clubs/:id')
  @ApiOperation({ summary: 'Get club details' })
  @ApiParam({ name: 'id', type: String })
  async findClubById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.campusLifeService.findClubById(universityId, id);
  }

  @Patch('clubs/:id')
  @ApiOperation({ summary: 'Update a club' })
  @ApiParam({ name: 'id', type: String })
  async updateClub(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.updateClub(universityId, id, body);
  }

  @Delete('clubs/:id')
  @ApiOperation({ summary: 'Delete a club' })
  @ApiParam({ name: 'id', type: String })
  async deleteClub(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.campusLifeService.deleteClub(universityId, id);
    return { success: true };
  }

  // --- Transport ---

  @Post('transport')
  @ApiOperation({ summary: 'Create a transport route' })
  async createTransportRoute(
    @UniversityId() universityId: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.createTransportRoute(universityId, body);
  }

  @Get('transport')
  @ApiOperation({ summary: 'Get transport routes' })
  async findTransportRoutes(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
  ) {
    return this.campusLifeService.findTransportRoutes(universityId, query);
  }

  @Get('transport/:id/live')
  @ApiOperation({ summary: 'Get live shuttle position and stop ETAs for a route' })
  @ApiParam({ name: 'id', type: String })
  async getTransportLive(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.campusLifeService.getTransportLive(universityId, id);
  }

  @Get('transport/:id')
  @ApiOperation({ summary: 'Get transport route details' })
  @ApiParam({ name: 'id', type: String })
  async findTransportRouteById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.campusLifeService.findTransportRouteById(universityId, id);
  }

  @Patch('transport/:id')
  @ApiOperation({ summary: 'Update a transport route' })
  @ApiParam({ name: 'id', type: String })
  async updateTransportRoute(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.updateTransportRoute(universityId, id, body);
  }

  @Delete('transport/:id')
  @ApiOperation({ summary: 'Delete a transport route' })
  @ApiParam({ name: 'id', type: String })
  async deleteTransportRoute(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.campusLifeService.deleteTransportRoute(universityId, id);
    return { success: true };
  }

  // --- Printing ---

  @Post('printing')
  @ApiOperation({ summary: 'Create a print service' })
  async createPrintService(
    @UniversityId() universityId: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.createPrintService(universityId, body);
  }

  @Get('printing')
  @ApiOperation({ summary: 'Get printing services' })
  async findPrintServices(
    @UniversityId() universityId: string,
    @Query() query: PaginationDto,
  ) {
    return this.campusLifeService.findPrintServices(universityId, query);
  }

  @Get('printing/:id')
  @ApiOperation({ summary: 'Get print service details' })
  @ApiParam({ name: 'id', type: String })
  async findPrintServiceById(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    return this.campusLifeService.findPrintServiceById(universityId, id);
  }

  @Patch('printing/:id')
  @ApiOperation({ summary: 'Update a print service' })
  @ApiParam({ name: 'id', type: String })
  async updatePrintService(
    @UniversityId() universityId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.campusLifeService.updatePrintService(universityId, id, body);
  }

  @Delete('printing/:id')
  @ApiOperation({ summary: 'Delete a print service' })
  @ApiParam({ name: 'id', type: String })
  async deletePrintService(
    @UniversityId() universityId: string,
    @Param('id') id: string,
  ) {
    await this.campusLifeService.deletePrintService(universityId, id);
    return { success: true };
  }
}
