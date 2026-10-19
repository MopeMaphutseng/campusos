import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { LibraryModule } from './modules/library/library.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { MentorshipModule } from './modules/mentorship/mentorship.module';
import { ScholarshipsModule } from './modules/scholarships/scholarships.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { InnovationHubModule } from './modules/innovation-hub/innovation-hub.module';
import { ResearchHubModule } from './modules/research-hub/research-hub.module';
import { CampusLifeModule } from './modules/campus-life/campus-life.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { TargetingModule } from './modules/targeting/targeting.module';
import { AiTutorModule } from './modules/ai-tutor/ai-tutor.module';
import { SportsModule } from './modules/sports/sports.module';
import { NewsModule } from './modules/news/news.module';
import { AlumniModule } from './modules/alumni/alumni.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TrustSafetyModule } from './modules/trust-safety/trust-safety.module';
import { VerifiableCredentialsModule } from './modules/verifiable-credentials/verifiable-credentials.module';
import { SmsUssdModule } from './modules/sms-ussd/sms-ussd.module';
import { SeminarsModule } from './modules/seminars/seminar.module';
import { MonetizationModule } from './modules/monetization/monetization.module';
import { EmailModule } from './modules/email/email.module';
import { PlannerModule } from './modules/planner/planner.module';
import { ProfileModule } from './modules/profile/profile.module';
import { dataSourceOptions } from './config/data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): any => {
        const redisHost = config.get<string>('REDIS_HOST');
        const cacheStore = config.get<string>('CACHE_STORE');
        // Fall back to in-memory cache when Redis is not configured
        // (e.g. hosted environments that do not provision Redis).
        if (cacheStore === 'memory' || !redisHost) {
          return { ttl: 60 * 1000 };
        }
        return {
          store: 'redis',
          host: redisHost,
          port: config.get<number>('REDIS_PORT', 6379),
          ttl: 60 * 1000,
        };
      },
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'auth',
        ttl: 60000,
        limit: 10,
      },
    ]),
    AuthModule,
    TenantsModule,
    DashboardModule,
    AcademicsModule,
    LibraryModule,
    MarketplaceModule,
    MentorshipModule,
    ScholarshipsModule,
    JobsModule,
    InnovationHubModule,
    ResearchHubModule,
    CampusLifeModule,
    HealthModule,
    AdminModule,
    TargetingModule,
    AiTutorModule,
    SportsModule,
    NewsModule,
    AlumniModule,
    MessagingModule,
    NotificationsModule,
    PaymentsModule,
    TrustSafetyModule,
    VerifiableCredentialsModule,
    SmsUssdModule,
    SeminarsModule,
    MonetizationModule,
    EmailModule,
    PlannerModule,
    ProfileModule,
  ],
})
export class AppModule {}
