import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from './ai-provider.interface';
import { OpenAICompatibleProvider } from './openai-compatible.provider';

/**
 * Mistral AI — OpenAI-compatible chat completions API.
 * Config: MISTRAL_API_KEY, MISTRAL_BASE_URL, MISTRAL_MODEL, MISTRAL_RATE_LIMIT_RPM.
 *
 * isAvailable() reflects the account's live quota: Mistral returns 429 with
 * x-ratelimit-limit-req-minute: 0 when the plan allows no chat requests, so
 * the provider correctly reports unavailable and the chain falls through to
 * Gemini/NVIDIA until the Mistral plan is topped up.
 */
@Injectable()
export class MistralProvider extends OpenAICompatibleProvider {
  readonly provider = AIProvider.MISTRAL;
  readonly name = 'Mistral AI';
  protected readonly envPrefix = 'MISTRAL';
  protected readonly baseUrlDefault = 'https://api.mistral.ai/v1';
  protected readonly modelDefault = 'mistral-small-latest';
  constructor(config: ConfigService) {
    super(config);
  }
}
