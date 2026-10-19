import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryItem, LibraryItemType } from './entities/library-item.entity';
import { LibraryCategory } from './entities/library-category.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { AIService } from '../ai-tutor/services/ai.service';
import { CitationFormat } from '../ai-tutor/services/ai-provider.interface';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(LibraryItem) private itemRepo: Repository<LibraryItem>,
    @InjectRepository(LibraryCategory) private categoryRepo: Repository<LibraryCategory>,
    private aiService: AIService,
  ) {}

  async createItem(universityId: string, data: Partial<LibraryItem>): Promise<LibraryItem> {
    const item = this.itemRepo.create({ ...data, universityId });
    return this.itemRepo.save(item);
  }

  async findItems(universityId: string, query: PaginationDto, filters?: {
    faculty?: string;
    courseId?: string;
    type?: LibraryItemType;
    categoryId?: string;
  }): Promise<PaginatedResult<LibraryItem>> {
    const qb = this.itemRepo.createQueryBuilder('item')
      .where('item.universityId = :universityId', { universityId });

    if (query.search) {
      qb.andWhere('(item.title ILIKE :search OR item.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (filters?.faculty) {
      qb.andWhere('item.faculty = :faculty', { faculty: filters.faculty });
    }
    if (filters?.courseId) {
      qb.andWhere('item.courseId = :courseId', { courseId: filters.courseId });
    }
    if (filters?.type) {
      qb.andWhere('item.type = :type', { type: filters.type });
    }
    if (filters?.categoryId) {
      qb.andWhere('item.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    const [items, total] = await qb
      .orderBy(`item.${query.sortBy}`, query.sortOrder)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, query.page, query.limit);
  }

  async findItemById(universityId: string, id: string): Promise<LibraryItem> {
    const item = await this.itemRepo.findOne({ where: { id, universityId } });
    if (!item) throw new NotFoundException('Library item not found');
    item.viewCount += 1;
    await this.itemRepo.save(item);
    return item;
  }

  async updateItem(universityId: string, id: string, data: Partial<LibraryItem>): Promise<LibraryItem> {
    const item = await this.itemRepo.findOne({ where: { id, universityId } });
    if (!item) throw new NotFoundException('Library item not found');
    Object.assign(item, data);
    return this.itemRepo.save(item);
  }

  async deleteItem(universityId: string, id: string): Promise<void> {
    const item = await this.itemRepo.findOne({ where: { id, universityId } });
    if (!item) throw new NotFoundException('Library item not found');
    await this.itemRepo.softRemove(item);
  }

  async voteItem(universityId: string, id: string, direction: 'up' | 'down'): Promise<LibraryItem> {
    const item = await this.itemRepo.findOne({ where: { id, universityId } });
    if (!item) throw new NotFoundException('Library item not found');
    if (direction === 'up') item.upvotes += 1;
    else item.downvotes += 1;
    return this.itemRepo.save(item);
  }

  private itemContext(item: LibraryItem): string[] {
    const body = item.content || item.description;
    return body ? [`${item.title}: ${body.slice(0, 2000)}`] : [];
  }

  async generateAiExplainer(universityId: string, userId: string, id: string): Promise<{ explanation: string; tokensUsed: number }> {
    const item = await this.findItemById(universityId, id);
    const result = await this.aiService.explain({
      topic: item.title,
      universityId,
      userId,
      courseId: item.courseId,
      courseCode: item.courseCode,
      contextMaterials: this.itemContext(item),
      difficulty: 'intermediate',
    });
    return { explanation: result.explanation, tokensUsed: result.tokensUsed };
  }

  async generateAiSummary(universityId: string, userId: string, id: string): Promise<{ summary: string; keyTopics: string[]; tokensUsed: number }> {
    const item = await this.findItemById(universityId, id);
    const body = item.content || item.description || item.title;
    const result = await this.aiService.summarize({
      text: body,
      universityId,
      userId,
      courseId: item.courseId,
    });
    item.aiSummary = {
      summary: result.summary,
      keyTopics: result.keyTopics,
      difficulty: 'intermediate',
    };
    await this.itemRepo.save(item);
    return { summary: result.summary, keyTopics: result.keyTopics, tokensUsed: result.tokensUsed };
  }

  async generateFlashcards(universityId: string, userId: string, id: string): Promise<Array<{ front: string; back: string }>> {
    const item = await this.findItemById(universityId, id);
    const body = item.content || item.description || item.title;
    const result = await this.aiService.generateFlashcards({
      text: body,
      universityId,
      userId,
      courseId: item.courseId,
      count: 8,
    });
    return result.flashcards.map((f) => ({ front: f.front, back: f.back }));
  }

  async generateCitation(universityId: string, userId: string, id: string, format: string): Promise<{ citation: string }> {
    const item = await this.findItemById(universityId, id);
    const normalized = (format || '').toLowerCase();
    const citationFormat = normalized === 'mla'
      ? CitationFormat.MLA
      : normalized === 'chicago' || normalized === 'harvard'
        ? CitationFormat.HARVARD
        : CitationFormat.APA;
    const result = await this.aiService.generateCitation({
      source: {
        title: item.title,
        url: item.externalUrl,
        year: item.createdAt ? new Date(item.createdAt).getFullYear() : undefined,
      },
      format: citationFormat,
      universityId,
      userId,
    });
    return { citation: result.citation };
  }

  async createCategory(universityId: string, data: Partial<LibraryCategory>): Promise<LibraryCategory> {
    const category = this.categoryRepo.create({ ...data, universityId });
    return this.categoryRepo.save(category);
  }

  async findCategories(universityId: string): Promise<LibraryCategory[]> {
    return this.categoryRepo.find({
      where: { universityId },
      order: { sortOrder: 'ASC' },
    });
  }

  async updateCategory(universityId: string, id: string, data: Partial<LibraryCategory>): Promise<LibraryCategory> {
    const category = await this.categoryRepo.findOne({ where: { id, universityId } });
    if (!category) throw new NotFoundException('Category not found');
    Object.assign(category, data);
    return this.categoryRepo.save(category);
  }

  async deleteCategory(universityId: string, id: string): Promise<void> {
    const category = await this.categoryRepo.findOne({ where: { id, universityId } });
    if (!category) throw new NotFoundException('Category not found');
    await this.categoryRepo.softRemove(category);
  }
}
