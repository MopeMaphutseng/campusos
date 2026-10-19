import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampusMapLocation, MapLocationType } from './entities/campus-map.entity';
import { CafeteriaOrder, CafeteriaOrderStatus } from './entities/cafeteria-order.entity';
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
    const order = this.orderRepo.create({
      ...data,
      universityId,
      userId,
      status: CafeteriaOrderStatus.PENDING,
      totalAmount: data.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0,
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
