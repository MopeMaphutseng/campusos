import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { CampusMapLocation, MapLocationType } from './entities/campus-map.entity';
import { CafeteriaOrder, CafeteriaOrderStatus } from './entities/cafeteria-order.entity';
import { CafeteriaMenu, MealType } from './entities/cafeteria-menu.entity';
import { Hostel, HostelStatus } from './entities/hostel.entity';
import { Club } from './entities/club.entity';
import { TransportRoute } from './entities/transport-route.entity';
import { PrintService } from './entities/print-service.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CampusLifeService {
  constructor(
    @InjectRepository(CampusMapLocation) private mapRepo: Repository<CampusMapLocation>,
    @InjectRepository(CafeteriaOrder) private orderRepo: Repository<CafeteriaOrder>,
    @InjectRepository(CafeteriaMenu) private menuRepo: Repository<CafeteriaMenu>,
    @InjectRepository(Hostel) private hostelRepo: Repository<Hostel>,
    @InjectRepository(Club) private clubRepo: Repository<Club>,
    @InjectRepository(TransportRoute) private transportRepo: Repository<TransportRoute>,
    @InjectRepository(PrintService) private printRepo: Repository<PrintService>,
  ) {}

  async createMapLocation(universityId: string, data: Partial<CampusMapLocation>): Promise<CampusMapLocation> {
    const location = this.mapRepo.create({ ...data, universityId });
    return this.mapRepo.save(location);
  }

  async findMapLocations(universityId: string, type?: MapLocationType): Promise<CampusMapLocation[]> {
    const where: any = { universityId, isActive: true };
    if (type) where.type = type;
    return this.mapRepo.find({ where, order: { name: 'ASC' } });
  }

  async updateMapLocation(universityId: string, id: string, data: Partial<CampusMapLocation>): Promise<CampusMapLocation> {
    const location = await this.mapRepo.findOne({ where: { id, universityId } });
    if (!location) throw new NotFoundException('Location not found');
    Object.assign(location, data);
    return this.mapRepo.save(location);
  }

  async deleteMapLocation(universityId: string, id: string): Promise<void> {
    const location = await this.mapRepo.findOne({ where: { id, universityId } });
    if (!location) throw new NotFoundException('Location not found');
    location.isActive = false;
    await this.mapRepo.save(location);
  }

  async createCafeteriaOrder(universityId: string, userId: string, data: Partial<CafeteriaOrder>): Promise<CafeteriaOrder> {
    const rawItems = Array.isArray(data.items) ? data.items : [];
    if (rawItems.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }
    if (rawItems.length > 50) {
      throw new BadRequestException('Order contains too many items');
    }

    const lines = rawItems.map((item: any) => {
      const menuItemId = typeof item?.menuItemId === 'string' ? item.menuItemId : '';
      const quantity = Number(item?.quantity);
      if (!isUUID(menuItemId)) {
        throw new BadRequestException('Each order item must reference a valid menuItemId');
      }
      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
        throw new BadRequestException('Item quantity must be a positive integer (max 100)');
      }
      const notes = typeof item?.notes === 'string' ? item.notes : undefined;
      return { menuItemId, quantity, notes };
    });

    // Prices are authoritative: look them up from the menu, never from the client.
    const ids = [...new Set(lines.map((l) => l.menuItemId))];
    const menus = await this.menuRepo.find({
      where: { id: In(ids), universityId, isAvailable: true },
    });
    const byId = new Map(menus.map((m) => [m.id, m]));

    const items = lines.map((line) => {
      const menu = byId.get(line.menuItemId);
      if (!menu) {
        throw new BadRequestException('One or more items are unavailable');
      }
      const price = Number(menu.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new BadRequestException('Menu item has an invalid price');
      }
      return {
        menuItemId: menu.id,
        name: menu.itemName,
        quantity: line.quantity,
        price,
        ...(line.notes ? { notes: line.notes } : {}),
      };
    });

    const totalAmount = Math.round(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
    ) / 100;
    if (totalAmount <= 0) {
      throw new BadRequestException('Order total must be greater than zero');
    }

    const shops = [
      ...new Set(
        items
          .map((item) => byId.get(item.menuItemId)?.shopName)
          .filter((name): name is string => !!name),
      ),
    ];
    const cafeteriaName = shops.length === 1 ? shops[0] : 'Campus Cafeteria';
    const currency = byId.get(items[0].menuItemId)?.currency || 'LSL';

    const order = this.orderRepo.create({
      universityId,
      userId,
      cafeteriaName,
      items,
      totalAmount,
      currency,
      status: CafeteriaOrderStatus.PENDING,
      pickupLocation:
        typeof data.pickupLocation === 'string' && data.pickupLocation.trim()
          ? data.pickupLocation.trim()
          : cafeteriaName,
      specialInstructions: data.specialInstructions,
      paymentMethod: data.paymentMethod,
    });
    return this.orderRepo.save(order);
  }

  async findCafeteriaOrders(universityId: string, userId: string): Promise<CafeteriaOrder[]> {
    return this.orderRepo.find({
      where: { universityId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateOrderStatus(universityId: string, id: string, status: CafeteriaOrderStatus): Promise<CafeteriaOrder> {
    const order = await this.orderRepo.findOne({ where: { id, universityId } });
    if (!order) throw new NotFoundException('Order not found');
    order.status = status;
    if (status === CafeteriaOrderStatus.DELIVERED || status === CafeteriaOrderStatus.READY) {
      order.completedAt = new Date();
    }
    return this.orderRepo.save(order);
  }

  // --- Cafeteria daily menu ---

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async findDailyMenu(
    universityId: string,
    date?: string,
    mealType?: MealType,
    shopId?: string,
  ): Promise<CafeteriaMenu[]> {
    const where: any = {
      universityId,
      date: date || this.todayIso(),
      isAvailable: true,
    };
    if (mealType) where.mealType = mealType;
    if (shopId) where.shopId = shopId;
    return this.menuRepo.find({
      where,
      order: { shopName: 'ASC', mealType: 'ASC', itemName: 'ASC' },
    });
  }

  async findWeeklyMenu(universityId: string, startDate?: string): Promise<CafeteriaMenu[]> {
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startIso = start.toISOString().slice(0, 10);
    const endIso = end.toISOString().slice(0, 10);
    return this.menuRepo
      .createQueryBuilder('m')
      .where('m.universityId = :universityId', { universityId })
      .andWhere('m.date BETWEEN :startIso AND :endIso', { startIso, endIso })
      .andWhere('m.isAvailable = true')
      .orderBy('m.date', 'ASC')
      .addOrderBy('m.mealType', 'ASC')
      .getMany();
  }

  async createMenuItem(universityId: string, data: Partial<CafeteriaMenu>): Promise<CafeteriaMenu> {
    const item = this.menuRepo.create({ ...data, universityId });
    return this.menuRepo.save(item);
  }

  async updateMenuItem(universityId: string, id: string, data: Partial<CafeteriaMenu>): Promise<CafeteriaMenu> {
    const item = await this.menuRepo.findOne({ where: { id, universityId } });
    if (!item) throw new NotFoundException('Menu item not found');
    Object.assign(item, data);
    return this.menuRepo.save(item);
  }

  async deleteMenuItem(universityId: string, id: string): Promise<void> {
    const item = await this.menuRepo.findOne({ where: { id, universityId } });
    if (!item) throw new NotFoundException('Menu item not found');
    await this.menuRepo.softRemove(item);
  }

  async findHostels(universityId: string): Promise<Hostel[]> {
    return this.hostelRepo.find({
      where: { universityId },
      order: { name: 'ASC' },
    });
  }

  async findAvailableHostels(universityId: string): Promise<Hostel[]> {
    return this.hostelRepo.find({
      where: { universityId, status: HostelStatus.AVAILABLE },
      order: { name: 'ASC' },
    });
  }

  async findHostelById(universityId: string, id: string): Promise<Hostel> {
    const hostel = await this.hostelRepo.findOne({ where: { id, universityId } });
    if (!hostel) throw new NotFoundException('Hostel not found');
    return hostel;
  }

  async createHostel(universityId: string, data: Partial<Hostel>): Promise<Hostel> {
    const hostel = this.hostelRepo.create({ ...data, universityId });
    return this.hostelRepo.save(hostel);
  }

  async updateHostel(universityId: string, id: string, data: Partial<Hostel>): Promise<Hostel> {
    const hostel = await this.hostelRepo.findOne({ where: { id, universityId } });
    if (!hostel) throw new NotFoundException('Hostel not found');
    Object.assign(hostel, data);
    return this.hostelRepo.save(hostel);
  }

  // --- Clubs ---

  async createClub(universityId: string, data: Partial<Club>): Promise<Club> {
    const club = this.clubRepo.create({ ...data, universityId });
    return this.clubRepo.save(club);
  }

  async findClubs(
    universityId: string,
    query: PaginationDto,
    filters?: { category?: string; isActive?: boolean },
  ): Promise<PaginatedResult<Club>> {
    const where: any = { universityId };
    if (filters?.category) where.category = filters.category;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const [items, total] = await this.clubRepo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findClubById(universityId: string, id: string): Promise<Club> {
    const club = await this.clubRepo.findOne({ where: { id, universityId } });
    if (!club) throw new NotFoundException('Club not found');
    return club;
  }

  async updateClub(universityId: string, id: string, data: Partial<Club>): Promise<Club> {
    const club = await this.findClubById(universityId, id);
    Object.assign(club, data);
    return this.clubRepo.save(club);
  }

  async deleteClub(universityId: string, id: string): Promise<void> {
    const club = await this.findClubById(universityId, id);
    await this.clubRepo.remove(club);
  }

  // --- Transport ---

  async createTransportRoute(universityId: string, data: Partial<TransportRoute>): Promise<TransportRoute> {
    const route = this.transportRepo.create({ ...data, universityId });
    return this.transportRepo.save(route);
  }

  async findTransportRoutes(
    universityId: string,
    query: PaginationDto,
  ): Promise<PaginatedResult<TransportRoute>> {
    const [items, total] = await this.transportRepo.findAndCount({
      where: { universityId },
      order: { routeNumber: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findTransportRouteById(universityId: string, id: string): Promise<TransportRoute> {
    const route = await this.transportRepo.findOne({ where: { id, universityId } });
    if (!route) throw new NotFoundException('Transport route not found');
    return route;
  }

  async getTransportLive(
    universityId: string,
    routeId: string,
  ): Promise<{
    route: TransportRoute;
    vehicle: { lat: number | null; lng: number | null; lastUpdated: Date | null };
    stops: Array<{ name: string; lat: number; lng: number; order: number; distanceKm: number | null; etaMinutes: number | null }>;
  }> {
    const route = await this.findTransportRouteById(universityId, routeId);
    let lat = route.currentLat != null ? Number(route.currentLat) : null;
    let lng = route.currentLng != null ? Number(route.currentLng) : null;
    let lastUpdated: Date | null = route.lastUpdated ?? null;

    // Simulate the shuttle gliding along the route polyline so the tracker
    // feels live. A full loop takes 5 minutes; position is derived from the
    // server clock and does not need to be persisted.
    const orderedStops = [...(route.stops || [])].sort((a, b) => a.order - b.order);
    if (orderedStops.length >= 2) {
      const cycleMs = 5 * 60 * 1000;
      const progress = (Date.now() % cycleMs) / cycleMs;
      const legs = orderedStops.length - 1;
      const scaled = progress * legs;
      const segIndex = Math.min(Math.floor(scaled), legs - 1);
      const segT = scaled - segIndex;
      const from = orderedStops[segIndex];
      const to = orderedStops[segIndex + 1];
      lat = from.lat + (to.lat - from.lat) * segT;
      lng = from.lng + (to.lng - from.lng) * segT;
      lastUpdated = new Date();
    }

    const haversine = (a: number, b: number, c: number, d: number): number => {
      const R = 6371;
      const dLat = ((c - a) * Math.PI) / 180;
      const dLng = ((d - b) * Math.PI) / 180;
      const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a * Math.PI) / 180) * Math.cos((c * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(s));
    };

    const avgSpeedKmh = 20;
    const stops = orderedStops.map((stop) => {
      const distanceKm =
        lat != null && lng != null ? haversine(lat, lng, stop.lat, stop.lng) : null;
      const etaMinutes =
        distanceKm != null ? Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60)) : null;
      return { ...stop, distanceKm, etaMinutes };
    });

    return {
      route,
      vehicle: { lat, lng, lastUpdated },
      stops,
    };
  }

  async updateTransportRoute(universityId: string, id: string, data: Partial<TransportRoute>): Promise<TransportRoute> {
    const route = await this.findTransportRouteById(universityId, id);
    Object.assign(route, data);
    return this.transportRepo.save(route);
  }

  async deleteTransportRoute(universityId: string, id: string): Promise<void> {
    const route = await this.findTransportRouteById(universityId, id);
    await this.transportRepo.remove(route);
  }

  // --- Printing ---

  async createPrintService(universityId: string, data: Partial<PrintService>): Promise<PrintService> {
    const service = this.printRepo.create({ ...data, universityId });
    return this.printRepo.save(service);
  }

  async findPrintServices(
    universityId: string,
    query: PaginationDto,
  ): Promise<PaginatedResult<PrintService>> {
    const [items, total] = await this.printRepo.findAndCount({
      where: { universityId },
      order: { shopName: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findPrintServiceById(universityId: string, id: string): Promise<PrintService> {
    const service = await this.printRepo.findOne({ where: { id, universityId } });
    if (!service) throw new NotFoundException('Print service not found');
    return service;
  }

  async updatePrintService(universityId: string, id: string, data: Partial<PrintService>): Promise<PrintService> {
    const service = await this.findPrintServiceById(universityId, id);
    Object.assign(service, data);
    return this.printRepo.save(service);
  }

  async deletePrintService(universityId: string, id: string): Promise<void> {
    const service = await this.findPrintServiceById(universityId, id);
    await this.printRepo.remove(service);
  }
}
