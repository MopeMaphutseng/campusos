import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrustSafetyController } from './trust-safety.controller';
import { TrustSafetyService } from './trust-safety.service';
import { Report } from './entities/report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report])],
  controllers: [TrustSafetyController],
  providers: [TrustSafetyService],
  exports: [TrustSafetyService],
})
export class TrustSafetyModule {}
