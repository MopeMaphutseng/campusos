import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User } from '../tenants/entities/user.entity';
import { TutorSession } from '../ai-tutor/entities/tutor-session.entity';
import { Enrollment } from '../academics/entities/enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, TutorSession, Enrollment])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
