import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, ListingStatus } from './entities/listing.entity';
import { Review, ReviewStatus } from './entities/review.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(Listing) private listingRepo: Repository<Listing>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
  ) {}

  async createListing(universityId: string, sellerId: string, data: Partial<Listing>): Promise<Listing> {
    const listing = this.listingRepo.create({ ...data, universityId, sellerId });
    return this.listingRepo.save(listing);
  }

  async findListings(universityId: string, query: PaginationDto, filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<PaginatedResult<Listing>> {
    const qb = this.listingRepo.createQueryBuilder('listing')
      .where('listing.universityId = :universityId', { universityId })
      .andWhere('listing.status = :status', { status: ListingStatus.ACTIVE });

    if (query.search) {
      qb.andWhere('(listing.title ILIKE :search OR listing.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (filters?.category) {
      qb.andWhere('listing.category = :category', { category: filters.category });
    }
    if (filters?.minPrice) {
      qb.andWhere('listing.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters?.maxPrice) {
      qb.andWhere('listing.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    const [items, total] = await qb
      .orderBy(`listing.${query.sortBy}`, query.sortOrder)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findListingById(universityId: string, id: string): Promise<Listing> {
    const listing = await this.listingRepo.findOne({ where: { id, universityId } });
    if (!listing) throw new NotFoundException('Listing not found');
    listing.viewCount += 1;
    await this.listingRepo.save(listing);
    return listing;
  }

  async updateListing(universityId: string, id: string, userId: string, data: Partial<Listing>): Promise<Listing> {
    const listing = await this.listingRepo.findOne({ where: { id, universityId } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) throw new ForbiddenException('Not your listing');
    Object.assign(listing, data);
    return this.listingRepo.save(listing);
  }

  async deleteListing(universityId: string, id: string, userId: string): Promise<void> {
    const listing = await this.listingRepo.findOne({ where: { id, universityId } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) throw new ForbiddenException('Not your listing');
    listing.status = ListingStatus.REMOVED;
    await this.listingRepo.save(listing);
  }

  async markAsSold(universityId: string, id: string, userId: string): Promise<Listing> {
    const listing = await this.listingRepo.findOne({ where: { id, universityId } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) throw new ForbiddenException('Not your listing');
    listing.status = ListingStatus.SOLD;
    return this.listingRepo.save(listing);
  }

  async createReview(universityId: string, reviewerId: string, data: Partial<Review>): Promise<Review> {
    const existing = await this.reviewRepo.findOne({
      where: { universityId, reviewerId, listingId: data.listingId },
    });
    if (existing) throw new Error('Already reviewed this listing');

    const review = this.reviewRepo.create({ ...data, universityId, reviewerId });
    return this.reviewRepo.save(review);
  }

  async findReviewsForUser(universityId: string, userId: string): Promise<Review[]> {
    return this.reviewRepo.find({
      where: { universityId, revieweeId: userId, status: ReviewStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  async flagListing(universityId: string, id: string): Promise<void> {
    const listing = await this.listingRepo.findOne({ where: { id, universityId } });
    if (!listing) throw new NotFoundException('Listing not found');
    listing.status = ListingStatus.REMOVED;
    await this.listingRepo.save(listing);
  }
}
