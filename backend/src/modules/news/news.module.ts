import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsArticle } from './entities/news-article.entity';
import { StartupHubEntry } from './entities/startup-hub-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NewsArticle, StartupHubEntry])],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
