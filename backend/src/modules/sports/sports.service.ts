import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SportsMatch, MatchStatus, SportType } from './entities/match.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SportsService {
  constructor(
    @InjectRepository(SportsMatch) private matchRepo: Repository<SportsMatch>,
  ) {}

  async createMatch(universityId: string, data: Partial<SportsMatch>): Promise<SportsMatch> {
    const match = this.matchRepo.create({ ...data, universityId });
    return this.matchRepo.save(match);
  }

  async findAll(universityId: string, query: PaginationDto, filters?: {
    sport?: SportType;
    status?: MatchStatus;
    league?: string;
  }): Promise<PaginatedResult<SportsMatch>> {
    const qb = this.matchRepo.createQueryBuilder('m')
      .where('m.universityId = :universityId', { universityId });

    if (filters?.sport) {
      qb.andWhere('m.sport = :sport', { sport: filters.sport });
    }
    if (filters?.status) {
      qb.andWhere('m.status = :status', { status: filters.status });
    }
    if (filters?.league) {
      qb.andWhere('m.league = :league', { league: filters.league });
    }
    if (query.search) {
      qb.andWhere('(m.homeTeam ILIKE :search OR m.awayTeam ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [items, total] = await qb
      .orderBy(`m.${query.sortBy}`, query.sortOrder)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findById(universityId: string, id: string): Promise<SportsMatch> {
    const match = await this.matchRepo.findOne({ where: { id, universityId } });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  async updateMatch(universityId: string, id: string, userId: string, data: Partial<SportsMatch>): Promise<SportsMatch> {
    const match = await this.matchRepo.findOne({ where: { id, universityId } });
    if (!match) throw new NotFoundException('Match not found');
    Object.assign(match, data);
    return this.matchRepo.save(match);
  }

  async startMatch(universityId: string, id: string): Promise<SportsMatch> {
    const match = await this.matchRepo.findOne({ where: { id, universityId } });
    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== MatchStatus.SCHEDULED) throw new Error('Match cannot be started');
    match.status = MatchStatus.LIVE;
    match.startedAt = new Date();
    return this.matchRepo.save(match);
  }

  async updateScore(universityId: string, id: string, homeScore: number, awayScore: number): Promise<SportsMatch> {
    const match = await this.matchRepo.findOne({ where: { id, universityId } });
    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== MatchStatus.LIVE) throw new Error('Match is not live');
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    return this.matchRepo.save(match);
  }

  async completeMatch(universityId: string, id: string): Promise<SportsMatch> {
    const match = await this.matchRepo.findOne({ where: { id, universityId } });
    if (!match) throw new NotFoundException('Match not found');
    match.status = MatchStatus.COMPLETED;
    match.completedAt = new Date();
    return this.matchRepo.save(match);
  }

  async deleteMatch(universityId: string, id: string): Promise<void> {
    const match = await this.matchRepo.findOne({ where: { id, universityId } });
    if (!match) throw new NotFoundException('Match not found');
    match.status = MatchStatus.CANCELLED;
    await this.matchRepo.save(match);
  }

  async getLiveMatches(universityId: string): Promise<SportsMatch[]> {
    return this.matchRepo.find({
      where: { universityId, status: MatchStatus.LIVE },
      order: { startedAt: 'ASC' },
    });
  }

  async getUpcomingMatches(universityId: string): Promise<SportsMatch[]> {
    return this.matchRepo.find({
      where: { universityId, status: MatchStatus.SCHEDULED },
      order: { scheduledAt: 'ASC' },
      take: 10,
    });
  }

  async addLiveEvent(universityId: string, id: string, event: {
    minute: number;
    type: string;
    description: string;
    team: string;
  }): Promise<SportsMatch> {
    const match = await this.matchRepo.findOne({ where: { id, universityId } });
    if (!match) throw new NotFoundException('Match not found');
    match.events = [...(match.events as any[]), event];
    return this.matchRepo.save(match);
  }
}
