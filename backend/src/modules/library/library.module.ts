import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { LibraryItem } from './entities/library-item.entity';
import { LibraryCategory } from './entities/library-category.entity';
import { AiTutorModule } from '../ai-tutor/ai-tutor.module';

@Module({
  imports: [TypeOrmModule.forFeature([LibraryItem, LibraryCategory]), AiTutorModule],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
