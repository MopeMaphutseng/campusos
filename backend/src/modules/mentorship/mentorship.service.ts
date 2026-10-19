import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorProfile, MentorStatus } from './entities/mentor-profile.entity';
import { Booking, BookingStatus } from './entities/booking.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class MentorshipService {
  constructor(
    @InjectRepository(MentorProfile) private mentorRepo: Repository<MentorProfile>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  async createMentorProfile(universityId: string, userId: string, data: Partial<MentorProfile>): Promise<MentorProfile> {
    const existing = await this.mentorRepo.findOne({ where: { universityId, userId } });
    if (existing) throw new Error('Mentor profile already exists');

    const profile = this.mentorRepo.create({ ...data, universityId, userId });
    return this.mentorRepo.save(profile);
  }

  async findMentors(universityId: string, query: PaginationDto, filters?: {
    expertise?: string;
    status?: MentorStatus;
  }): Promise<PaginatedResult<MentorProfile>> {
    const qb = this.mentorRepo.createQueryBuilder('mentor')
      .where('mentor.universityId = :universityId', { universityId });

    if (filters?.status) {
      qb.andWhere('mentor.status = :status', { status: filters.status });
    }
    if (query.search) {
      qb.andWhere('(mentor.bio ILIKE :search)', { search: `%${query.search}%` });
    }

    const [items, total] = await qb
      .orderBy(`mentor.${query.sortBy}`, query.sortOrder)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findMentorById(universityId: string, id: string): Promise<MentorProfile> {
    const mentor = await this.mentorRepo.findOne({ where: { id, universityId } });
    if (!mentor) throw new NotFoundException('Mentor not found');
    return mentor;
  }

  async updateMentorProfile(universityId: string, userId: string, data: Partial<MentorProfile>): Promise<MentorProfile> {
    const profile = await this.mentorRepo.findOne({ where: { universityId, userId } });
    if (!profile) throw new NotFoundException('Mentor profile not found');
    Object.assign(profile, data);
    return this.mentorRepo.save(profile);
  }

  async bookMentor(universityId: string, menteeId: string, data: Partial<Booking>): Promise<Booking> {
    const mentor = await this.mentorRepo.findOne({ where: { id: data.mentorId, universityId } });
    if (!mentor) throw new NotFoundException('Mentor not found');
    if (mentor.status !== MentorStatus.AVAILABLE) throw new Error('Mentor is not available');
    if (mentor.currentMentees >= mentor.maxMentees) throw new Error('Mentor has reached maximum mentees');

    const booking = this.bookingRepo.create({
      ...data,
      universityId,
      menteeId,
      status: BookingStatus.PENDING,
    });

    mentor.currentMentees += 1;
    await this.mentorRepo.save(mentor);

    return this.bookingRepo.save(booking);
  }

  async updateBookingStatus(universityId: string, bookingId: string, userId: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId, universityId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.mentorId !== userId && booking.menteeId !== userId) {
      throw new ForbiddenException('Not authorized to update this booking');
    }
    booking.status = status;
    if (status === BookingStatus.COMPLETED || status === BookingStatus.CANCELLED) {
      const mentor = await this.mentorRepo.findOne({ where: { id: booking.mentorId } });
      if (mentor) {
        mentor.currentMentees = Math.max(0, mentor.currentMentees - 1);
        mentor.totalSessions += status === BookingStatus.COMPLETED ? 1 : 0;
        await this.mentorRepo.save(mentor);
      }
    }
    return this.bookingRepo.save(booking);
  }

  async getUserBookings(universityId: string, userId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: [
        { universityId, menteeId: userId },
        { universityId, mentorId: userId },
      ],
      order: { scheduledAt: 'DESC' },
    });
  }

  async getMentorBookings(universityId: string, mentorId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: { universityId, mentorId },
      order: { scheduledAt: 'DESC' },
    });
  }
}
