import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiTutorController } from './ai-tutor.controller';
import { AiTutorService } from './ai-tutor.service';
import { TutorSession } from './entities/tutor-session.entity';
import { AIService } from './services/ai.service';
import { ClaudeProvider } from './services/claude-provider';
import { GeminiProvider } from './services/gemini-provider';
import { NvidiaProvider } from './services/nvidia-provider';
import { OllamaProvider } from './services/ollama-provider';
import { MistralProvider } from './services/mistral-provider';
import { IAiProvider } from './services/ai-provider.interface';

@Module({
  imports: [TypeOrmModule.forFeature([TutorSession])],
  controllers: [AiTutorController],
  providers: [
    ClaudeProvider,
    GeminiProvider,
    NvidiaProvider,
    OllamaProvider,
    MistralProvider,
    { provide: IAiProvider, useClass: ClaudeProvider },
    AIService,
    AiTutorService,
  ],
  exports: [AiTutorService, AIService],
})
export class AiTutorModule {}
