import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentorshipController } from './mentorship.controller';
import { MentorshipService } from './mentorship.service';
import { MentorProfile } from './entities/mentor-profile.entity';
import { Booking } from './entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MentorProfile, Booking])],
  controllers: [MentorshipController],
  providers: [MentorshipService],
  exports: [MentorshipService],
})
export class MentorshipModule {}
