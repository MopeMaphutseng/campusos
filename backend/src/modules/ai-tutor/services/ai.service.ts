import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IAiProvider,
  AIProvider,
  AIUsageLog,
  IntegrityMode,
  GenerateTextInput,
  GenerateTextOutput,
  GenerateWithSystemPromptInput,
  StreamResponseInput,
  StreamChunk,
  SummarizeInput,
  SummarizeOutput,
  ExplainInput,
  ExplainOutput,
  GenerateFlashcardsInput,
  GenerateFlashcardsOutput,
  GenerateCitationInput,
  GenerateCitationOutput,
  ReviewCVInput,
  ReviewCVOutput,
  GenerateCoverLetterInput,
  GenerateCoverLetterOutput,
} from './ai-provider.interface';
import { ClaudeProvider } from './claude-provider';
import { GeminiProvider } from './gemini-provider';
import { NvidiaProvider } from './nvidia-provider';
import { OllamaProvider } from './ollama-provider';
import { MistralProvider } from './mistral-provider';

interface CacheEntry {
  result: GenerateTextOutput;
  timestamp: number;
  universityId: string;
  userId: string;
}

interface UniversityAIConfig {
  provider: AIProvider;
  integrityMode: IntegrityMode;
  maxTokensPerDay: number;
  allowedCourses?: string[];
}

interface UniversityUsageStats {
  totalTokensToday: number;
  totalRequestsToday: number;
  lastReset: Date;
  dailyLogs: AIUsageLog[];
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly providers = new Map<AIProvider, IAiProvider>();
  private readonly universityConfigs = new Map<string, UniversityAIConfig>();
  private readonly universityUsage = new Map<string, UniversityUsageStats>();
  private readonly responseCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly CACHE_MAX_ENTRIES = 1000;
  private readonly usageLogs: AIUsageLog[] = [];
  private readonly MAX_LOGS = 10_000;

  constructor(
    private config: ConfigService,
    private claudeProvider: ClaudeProvider,
    private geminiProvider: GeminiProvider,
    private nvidiaProvider: NvidiaProvider,
    private ollamaProvider: OllamaProvider,
    private mistralProvider: MistralProvider,
  ) {
    this.providers.set(AIProvider.CLAUDE, claudeProvider);
    this.providers.set(AIProvider.GEMINI, geminiProvider);
    this.providers.set(AIProvider.NVIDIA, nvidiaProvider);
    this.providers.set(AIProvider.OLLAMA, ollamaProvider);
    this.providers.set(AIProvider.MISTRAL, mistralProvider);

    this.setupCleanupInterval();
  }

  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupCache();
      this.cleanupLogs();
    }, 60_000);
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.responseCache) {
      if (now - entry.timestamp > this.CACHE_TTL_MS) {
        this.responseCache.delete(key);
      }
    }
  }

  private cleanupLogs(): void {
    if (this.usageLogs.length > this.MAX_LOGS) {
      this.usageLogs.splice(0, this.usageLogs.length - this.MAX_LOGS);
    }
  }

  private getCacheKey(method: string, input: Record<string, any>): string {
    const normalized = JSON.stringify(input, Object.keys(input).sort());
    return `${method}:${normalized}`;
  }

  private getCachedResult<T>(key: string): T | null {
    const entry = this.responseCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.CACHE_TTL_MS) {
      this.responseCache.delete(key);
      return null;
    }

    return entry.result as T;
  }

  private setCacheResult(key: string, result: any, universityId: string, userId: string): void {
    if (this.responseCache.size >= this.CACHE_MAX_ENTRIES) {
      const oldestKey = Array.from(this.responseCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0];
      if (oldestKey) this.responseCache.delete(oldestKey);
    }

    this.responseCache.set(key, { result, timestamp: Date.now(), universityId, userId });
  }

  private logUsage(log: Omit<AIUsageLog, 'id' | 'timestamp'>): void {
    const fullLog: AIUsageLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(),
    };
    this.usageLogs.push(fullLog);

    const stats = this.getUniversityUsageStats(log.universityId);
    stats.dailyLogs.push(fullLog);
    stats.totalTokensToday += log.tokensUsed;
    stats.totalRequestsToday += 1;

    this.logger.log(`AI usage: ${log.provider}/${log.method} - ${log.tokensUsed} tokens [${log.universityId}]`);
  }

  private getUniversityUsageStats(universityId: string): UniversityUsageStats {
    let stats = this.universityUsage.get(universityId);
    if (!stats) {
      stats = {
        totalTokensToday: 0,
        totalRequestsToday: 0,
        lastReset: new Date(),
        dailyLogs: [],
      };
      this.universityUsage.set(universityId, stats);
    }

    const hoursSinceReset = (Date.now() - stats.lastReset.getTime()) / (1000 * 60 * 60);
    if (hoursSinceReset >= 24) {
      stats.totalTokensToday = 0;
      stats.totalRequestsToday = 0;
      stats.dailyLogs = [];
      stats.lastReset = new Date();
    }

    return stats;
  }

  async configureUniversity(universityId: string, config: UniversityAIConfig): Promise<void> {
    this.universityConfigs.set(universityId, config);
  }

  getUniversityConfig(universityId: string): UniversityAIConfig | undefined {
    return this.universityConfigs.get(universityId);
  }

  private async getProviderForUniversity(universityId: string): Promise<IAiProvider> {
    const uniConfig = this.universityConfigs.get(universityId);
    const providerType = uniConfig?.provider ?? this.config.get<AIProvider>('AI_DEFAULT_PROVIDER', AIProvider.CLAUDE);
    const provider = this.providers.get(providerType);

    if (!provider) {
      throw new BadRequestException(`AI provider "${providerType}" is not available`);
    }

    if (!(await provider.isAvailable())) {
      this.logger.warn(`${provider.name} is unavailable, attempting fallback`);
      for (const [type, fallback] of this.providers) {
        if (type !== providerType && await fallback.isAvailable()) {
          return fallback;
        }
      }
      throw new BadRequestException('All AI providers are currently unavailable');
    }

    return provider;
  }

  /**
   * Runs a provider operation and, if that provider fails at runtime (429, 5xx,
   * network, quota, ...), retries the same operation on every other available
   * provider. The original error is rethrown only when all providers fail, so
   * callers still get an honest error instead of a masked one.
   *
   * Without this, only *pre-call* availability was checked: a provider that
   * looked healthy but failed during generation escaped straight to the global
   * exception handler as a 500.
   */
  private async callProviderWithFallback<T>(
    universityId: string,
    operation: string,
    call: (provider: IAiProvider) => Promise<T>,
  ): Promise<{ result: T; provider: IAiProvider }> {
    const primary = await this.getProviderForUniversity(universityId);
    try {
      return { result: await call(primary), provider: primary };
    } catch (err: any) {
      // Business/validation errors are not provider faults — never mask them.
      if (err instanceof BadRequestException) throw err;
      this.logger.warn(
        `${primary.name} failed during ${operation} (${err?.message ?? err}); attempting runtime fallback`,
      );
      for (const [type, fallback] of this.providers) {
        if (type === primary.provider) continue;
        try {
          if (!(await fallback.isAvailable())) continue;
          this.logger.log(`Runtime fallback to ${fallback.name} for ${operation}`);
          return { result: await call(fallback), provider: fallback };
        } catch (e2: any) {
          this.logger.warn(`${fallback.name} also failed during ${operation}: ${e2?.message ?? e2}`);
        }
      }
      throw err;
    }
  }

  private checkIntegrityMode(universityId: string, method: string): void {
    const uniConfig = this.universityConfigs.get(universityId);
    const mode = uniConfig?.integrityMode ?? IntegrityMode.FULL_ASSIST;

    if (mode === IntegrityMode.EXAM_MODE) {
      throw new BadRequestException('AI assistance is disabled during exams');
    }

    if (mode === IntegrityMode.EXPLAIN_ONLY) {
      const blockedMethods = ['generateText', 'generateFlashcards'];
      if (blockedMethods.includes(method)) {
        throw new BadRequestException(
          'This action is not permitted in explain-only mode. AI can only explain concepts, not generate content.',
        );
      }
    }
  }

  private checkTokenQuota(universityId: string, estimatedTokens: number): void {
    const uniConfig = this.universityConfigs.get(universityId);
    const maxTokens = uniConfig?.maxTokensPerDay ?? this.config.get<number>('AI_MAX_TOKENS_PER_DAY', 100_000);
    const stats = this.getUniversityUsageStats(universityId);

    if (stats.totalTokensToday + estimatedTokens > maxTokens) {
      throw new BadRequestException(
        `University token quota exceeded. Used: ${stats.totalTokensToday}/${maxTokens}. Resets at midnight.`,
      );
    }
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    this.checkIntegrityMode(input.universityId, 'generateText');
    this.checkTokenQuota(input.universityId, input.maxTokens ?? 2048);

    const cacheKey = this.getCacheKey('generateText', {
      prompt: input.prompt,
      courseCode: input.courseCode,
      contextMaterials: input.contextMaterials,
    });

    const cached = this.getCachedResult<GenerateTextOutput>(cacheKey);
    if (cached) {
      this.logUsage({
        universityId: input.universityId,
        userId: input.userId,
        provider: cached.provider,
        method: 'generateText',
        courseId: input.courseId,
        tokensUsed: 0,
        latencyMs: 0,
        cached: true,
      });
      return cached;
    }

    const { result } = await this.callProviderWithFallback(
      input.universityId,
      'generateText',
      (p) => p.generateText(input),
    );

    this.setCacheResult(cacheKey, result, input.universityId, input.userId);
    this.logUsage({
      universityId: input.universityId,
      userId: input.userId,
      provider: result.provider,
      method: 'generateText',
      courseId: input.courseId,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      cached: false,
    });

    return result;
  }

  async generateWithSystemPrompt(input: GenerateWithSystemPromptInput): Promise<GenerateTextOutput> {
    this.checkIntegrityMode(input.universityId, 'generateWithSystemPrompt');
    this.checkTokenQuota(input.universityId, input.maxTokens ?? 2048);

    const { result } = await this.callProviderWithFallback(
      input.universityId,
      'generateWithSystemPrompt',
      (p) => p.generateWithSystemPrompt(input),
    );

    this.logUsage({
      universityId: input.universityId,
      userId: input.userId,
      provider: result.provider,
      method: 'generateWithSystemPrompt',
      courseId: input.courseId,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      cached: false,
    });

    return result;
  }

  async *streamResponse(input: StreamResponseInput): AsyncGenerator<StreamChunk> {
    this.checkIntegrityMode(input.universityId, 'streamResponse');

    const provider = await this.getProviderForUniversity(input.universityId);

    let totalTokens = 0;
    const startTime = Date.now();

    for await (const chunk of provider.streamResponse(input)) {
      if (chunk.done && chunk.tokensUsed) {
        totalTokens = chunk.tokensUsed;
      }
      yield chunk;
    }

    this.logUsage({
      universityId: input.universityId,
      userId: input.userId,
      provider: provider.provider,
      method: 'streamResponse',
      courseId: input.courseId,
      tokensUsed: totalTokens,
      latencyMs: Date.now() - startTime,
      cached: false,
    });
  }

  async summarize(input: SummarizeInput): Promise<SummarizeOutput> {
    this.checkIntegrityMode(input.universityId, 'summarize');

    const { result, provider } = await this.callProviderWithFallback(
      input.universityId,
      'summarize',
      (p) => p.summarize(input),
    );

    this.logUsage({
      universityId: input.universityId,
      userId: input.userId,
      provider: provider.provider,
      method: 'summarize',
      courseId: input.courseId,
      tokensUsed: result.tokensUsed,
      latencyMs: 0,
      cached: false,
    });

    return result;
  }

  async explain(input: ExplainInput): Promise<ExplainOutput> {
    this.checkIntegrityMode(input.universityId, 'explain');

    const { result, provider } = await this.callProviderWithFallback(
      input.universityId,
      'explain',
      (p) => p.explain(input),
    );

    this.logUsage({
      universityId: input.universityId,
      userId: input.userId,
      provider: provider.provider,
      method: 'explain',
      courseId: input.courseId,
      tokensUsed: result.tokensUsed,
      latencyMs: 0,
      cached: false,
    });

    return result;
  }

  async generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
    this.checkIntegrityMode(input.universityId, 'generateFlashcards');

    const { result, provider } = await this.callProviderWithFallback(
      input.universityId,
      'generateFlashcards',
      (p) => p.generateFlashcards(input),
    );

    this.logUsage({
      universityId: input.universityId,
      userId: input.userId,
      provider: provider.provider,
      method: 'generateFlashcards',
      courseId: input.courseId,
      tokensUsed: result.tokensUsed,
      latencyMs: 0,
      cached: false,
    });

    return result;
  }

  async generateCitation(input: GenerateCitationInput): Promise<GenerateCitationOutput> {
    this.checkIntegrityMode(input.universityId, 'generateCitation');

    const { result, provider } = await this.callProviderWithFallback(
      input.universityId,
      'generateCitation',
      (p) => p.generateCitation(input),
    );

    this.logUsage({
      universityId: input.universityId,
      userId: input.userId,
      provider: provider.provider,
      method: 'generateCitation',
      tokensUsed: 0,
      latencyMs: 0,
      cached: false,
    });

    return result;
  }

  async reviewCV(input: ReviewCVInput): Promise<ReviewCVOutput> {
    this.checkIntegrityMode(input.universityId, 'reviewCV');

    const { result, provider } = await this.callProviderWithFallback(
      input.universityId,
      'reviewCV',
      (p) => p.reviewCV(input),
    );

    this.logUsage({
      universityId: input.universityId,
      userId: input.userId,
      provider: provider.provider,
      method: 'reviewCV',
      tokensUsed: result.tokensUsed,
      latencyMs: 0,
      cached: false,
    });

    return result;
  }

  async generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput> {
    this.checkIntegrityMode(input.universityId, 'generateCoverLetter');

    const { result, provider } = await this.callProviderWithFallback(
      input.universityId,
      'generateCoverLetter',
      (p) => p.generateCoverLetter(input),
    );

    this.logUsage({
      universityId: input.universityId,
      userId: input.userId,
      provider: provider.provider,
      method: 'generateCoverLetter',
      tokensUsed: result.tokensUsed,
      latencyMs: 0,
      cached: false,
    });

    return result;
  }

  async getUsageLogs(universityId: string, filters?: {
    userId?: string;
    method?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AIUsageLog[]> {
    let logs = this.usageLogs.filter((l) => l.universityId === universityId);

    if (filters?.userId) logs = logs.filter((l) => l.userId === filters.userId);
    if (filters?.method) logs = logs.filter((l) => l.method === filters.method);
    if (filters?.startDate) logs = logs.filter((l) => l.timestamp >= filters.startDate!);
    if (filters?.endDate) logs = logs.filter((l) => l.timestamp <= filters.endDate!);

    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return logs.slice(0, filters?.limit ?? 100);
  }

  async getUsageStats(universityId: string): Promise<{
    totalTokensToday: number;
    totalRequestsToday: number;
    providerBreakdown: Record<AIProvider, { requests: number; tokens: number }>;
    topMethods: Array<{ method: string; count: number; tokens: number }>;
  }> {
    const stats = this.getUniversityUsageStats(universityId);
    const logs = stats.dailyLogs;

    const providerBreakdown: Record<AIProvider, { requests: number; tokens: number }> = {
      [AIProvider.CLAUDE]: { requests: 0, tokens: 0 },
      [AIProvider.GEMINI]: { requests: 0, tokens: 0 },
      [AIProvider.NVIDIA]: { requests: 0, tokens: 0 },
      [AIProvider.OLLAMA]: { requests: 0, tokens: 0 },
      [AIProvider.MISTRAL]: { requests: 0, tokens: 0 },
    };

    const methodMap = new Map<string, { count: number; tokens: number }>();

    for (const log of logs) {
      providerBreakdown[log.provider].requests += 1;
      providerBreakdown[log.provider].tokens += log.tokensUsed;

      const method = methodMap.get(log.method) ?? { count: 0, tokens: 0 };
      method.count += 1;
      method.tokens += log.tokensUsed;
      methodMap.set(log.method, method);
    }

    const topMethods = Array.from(methodMap.entries())
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalTokensToday: stats.totalTokensToday,
      totalRequestsToday: stats.totalRequestsToday,
      providerBreakdown,
      topMethods,
    };
  }

  async getProviderHealth(): Promise<Record<AIProvider, { available: boolean; name: string }>> {
    const result: Record<string, { available: boolean; name: string }> = {};
    for (const [type, provider] of this.providers) {
      result[type] = { available: await provider.isAvailable(), name: provider.name };
    }
    return result as Record<AIProvider, { available: boolean; name: string }>;
  }

  clearCache(): void {
    this.responseCache.clear();
  }
}
