import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { University } from './entities/university.entity';
import { User } from './entities/user.entity';
import { UniversityModule } from './entities/university-module.entity';

@Module({
  imports: [TypeOrmModule.forFeature([University, User, UniversityModule])],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
