import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from './ai-provider.interface';
import { OpenAICompatibleProvider } from './openai-compatible.provider';

/**
 * Ollama (local, OpenAI-compatible /v1 endpoint) — this is the runtime Pula
 * Maliboho used for its Sesotho intelligence layer, so no cloud key is required.
 * Config: OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_RATE_LIMIT_RPM.
 */
@Injectable()
export class OllamaProvider extends OpenAICompatibleProvider {
  readonly provider = AIProvider.OLLAMA;
  readonly name = 'Ollama (local)';
  protected readonly envPrefix = 'OLLAMA';
  protected readonly baseUrlDefault = 'http://localhost:11434/v1';
  protected readonly modelDefault = 'llama3.2:3b';
  constructor(config: ConfigService) {
    super(config);
  }
  protected override readonly requiresKey = false;
}
