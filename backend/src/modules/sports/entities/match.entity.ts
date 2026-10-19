import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  COMPLETED = 'completed',
  POSTPONED = 'postponed',
  CANCELLED = 'cancelled',
}

export enum SportType {
  FOOTBALL = 'football',
  BASKETBALL = 'basketball',
  CRICKET = 'cricket',
  RUGBY = 'rugby',
  VOLLEYBALL = 'volleyball',
  ATHLETICS = 'athletics',
  TENNIS = 'tennis',
  SWIMMING = 'swimming',
  CHESS = 'chess',
  OTHER = 'other',
}

@Entity('sports_matches')
@Index(['universityId', 'status'])
@Index(['universityId', 'sport'])
@Index(['universityId', 'scheduledAt'])
export class SportsMatch extends TenantBaseEntity {
  @Column({ type: 'enum', enum: SportType })
  sport: SportType;

  @Column({ type: 'varchar', length: 255, name: 'home_team' })
  homeTeam: string;

  @Column({ type: 'varchar', length: 255, name: 'away_team' })
  awayTeam: string;

  @Column({ type: 'int', nullable: true, name: 'home_score' })
  homeScore: number;

  @Column({ type: 'int', nullable: true, name: 'away_score' })
  awayScore: number;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.SCHEDULED })
  status: MatchStatus;

  @Column({ type: 'timestamp', name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  venue: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  league: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  season: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  round: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  events: Array<{
    minute: number;
    type: string;
    description: string;
    team: string;
  }>;

  @Column({ type: 'boolean', default: false, name: 'is_live_tracked' })
  isLiveTracked: boolean;

  @Column({ type: 'int', default: 0, name: 'viewer_count' })
  viewerCount: number;

  @Column({ type: 'text', nullable: true, name: 'stream_url' })
  streamUrl: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;
}
