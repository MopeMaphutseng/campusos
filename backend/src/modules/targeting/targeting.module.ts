import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentTarget } from './entities/content-target.entity';
import { Enrollment } from '../academics/entities/enrollment.entity';
import { TargetingService } from './targeting.service';
import { TargetingInterceptor } from './targeting.interceptor';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ContentTarget, Enrollment])],
  providers: [
    TargetingService,
    { provide: APP_INTERCEPTOR, useClass: TargetingInterceptor },
  ],
  exports: [TargetingService],
})
export class TargetingModule {}
