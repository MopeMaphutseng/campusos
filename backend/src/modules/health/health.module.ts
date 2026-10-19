import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthAppointment } from './entities/health-appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HealthAppointment])],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
