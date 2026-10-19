import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminContentController } from './admin-content.controller';
import { AdminUploadsController } from './admin-uploads.controller';
import { AdminContentService } from './admin-content.service';
import { LibraryItem } from '../../library/entities/library-item.entity';
import { Scholarship } from '../../scholarships/entities/scholarship.entity';
import { JobListing } from '../../jobs/entities/job-listing.entity';
import { ResearchCall } from '../../research-hub/entities/research-call.entity';
import { CampusMapLocation } from '../../campus-life/entities/campus-map.entity';
import { NewsArticle } from '../../news/entities/news-article.entity';
import { Seminar } from '../../seminars/entities/seminar.entity';
import { MentorProfile } from '../../mentorship/entities/mentor-profile.entity';
import { User } from '../../tenants/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LibraryItem,
      Scholarship,
      JobListing,
      ResearchCall,
      CampusMapLocation,
      NewsArticle,
      Seminar,
      MentorProfile,
      User,
    ]),
  ],
  controllers: [AdminContentController, AdminUploadsController],
  providers: [AdminContentService],
  exports: [AdminContentService],
})
export class AdminContentModule {}
