import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from './ai-provider.interface';
import { OpenAICompatibleProvider } from './openai-compatible.provider';

/**
 * NVIDIA NIM — OpenAI-compatible chat completions API.
 * Config: NVIDIA_API_KEY, NVIDIA_BASE_URL, NVIDIA_MODEL, NVIDIA_RATE_LIMIT_RPM.
 */
@Injectable()
export class NvidiaProvider extends OpenAICompatibleProvider {
  readonly provider = AIProvider.NVIDIA;
  readonly name = 'NVIDIA NIM';
  protected readonly envPrefix = 'NVIDIA';
  protected readonly baseUrlDefault = 'https://integrate.api.nvidia.com/v1';
  protected readonly modelDefault = 'meta/llama-3.3-70b-instruct';
  constructor(config: ConfigService) {
    super(config);
  }
}
