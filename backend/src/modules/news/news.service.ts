import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsArticle, NewsCategory } from './entities/news-article.entity';
import { StartupHubEntry, StartupStage } from './entities/startup-hub-entry.entity';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsArticle) private articleRepo: Repository<NewsArticle>,
    @InjectRepository(StartupHubEntry) private startupRepo: Repository<StartupHubEntry>,
  ) {}

  async createArticle(universityId: string, authorId: string, data: Partial<NewsArticle>): Promise<NewsArticle> {
    const article = this.articleRepo.create({
      ...data,
      universityId,
      authorId,
      publishedAt: data.isPublished ? new Date() : null,
    });
    return this.articleRepo.save(article);
  }

  async getArticles(
    universityId: string,
    category?: NewsCategory,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: NewsArticle[]; total: number }> {
    const where: any = { universityId };
    if (category) where.category = category;

    const [items, total] = await this.articleRepo.findAndCount({
      where,
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  async getArticleById(universityId: string, id: string): Promise<NewsArticle> {
    const article = await this.articleRepo.findOne({ where: { id, universityId } });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async updateArticle(universityId: string, id: string, data: Partial<NewsArticle>): Promise<NewsArticle> {
    const article = await this.getArticleById(universityId, id);
    if (data.isPublished && !article.isPublished && !article.publishedAt) {
      data.publishedAt = new Date();
    }
    Object.assign(article, data);
    return this.articleRepo.save(article);
  }

  async deleteArticle(universityId: string, id: string): Promise<void> {
    const article = await this.getArticleById(universityId, id);
    await this.articleRepo.remove(article);
  }

  async incrementViewCount(universityId: string, id: string): Promise<void> {
    await this.articleRepo.increment({ id, universityId }, 'viewCount', 1);
  }

  async createStartup(universityId: string, founderId: string, data: Partial<StartupHubEntry>): Promise<StartupHubEntry> {
    const startup = this.startupRepo.create({
      ...data,
      universityId,
      founderId,
    });
    return this.startupRepo.save(startup);
  }

  async getStartups(
    universityId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: StartupHubEntry[]; total: number }> {
    const [items, total] = await this.startupRepo.findAndCount({
      where: { universityId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  async getStartupById(universityId: string, id: string): Promise<StartupHubEntry> {
    const startup = await this.startupRepo.findOne({ where: { id, universityId } });
    if (!startup) throw new NotFoundException('Startup not found');
    return startup;
  }

  async updateStartup(universityId: string, id: string, data: Partial<StartupHubEntry>): Promise<StartupHubEntry> {
    const startup = await this.getStartupById(universityId, id);
    Object.assign(startup, data);
    return this.startupRepo.save(startup);
  }
}
