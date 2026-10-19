import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IAiProvider,
  AIProvider,
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
  CitationFormat,
  ReviewCVInput,
  ReviewCVOutput,
  GenerateCoverLetterInput,
  GenerateCoverLetterOutput,
} from './ai-provider.interface';
import { buildGroundingBlock, ANTI_HALLUCINATION_RULE } from './grounding';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
  system?: string;
  stream?: boolean;
  temperature?: number;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

interface ClaudeStreamEvent {
  type: string;
  delta?: { type: string; text?: string };
  message?: { usage: { output_tokens: number } };
  usage?: { input_tokens: number; output_tokens: number };
}

interface RateLimitState {
  remaining: number;
  resetAt: Date;
  requests: number;
  windowStart: Date;
}

@Injectable()
export class ClaudeProvider extends IAiProvider {
  readonly provider = AIProvider.CLAUDE;
  readonly name = 'Claude (Anthropic)';
  private readonly logger = new Logger(ClaudeProvider.name);
  private readonly baseUrl = 'https://api.anthropic.com/v1/messages';
  private readonly rateLimits = new Map<string, RateLimitState>();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly RATE_LIMIT_WINDOW_MS = 60_000;
  private readonly DEFAULT_MAX_REQUESTS_PER_MINUTE = 60;

  constructor(private readonly config: ConfigService) {
    super();
  }

  private get apiKey(): string {
    return this.config.get<string>('ANTHROPIC_API_KEY', '');
  }

  private get defaultModel(): string {
    return this.config.get<string>('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514');
  }

  private get rateLimitPerMinute(): number {
    return this.config.get<number>('ANTHROPIC_RATE_LIMIT_RPM', this.DEFAULT_MAX_REQUESTS_PER_MINUTE);
  }

  private async checkRateLimit(universityId: string): Promise<void> {
    const now = new Date();
    const state = this.rateLimits.get(universityId);

    if (!state || now.getTime() - state.windowStart.getTime() > this.RATE_LIMIT_WINDOW_MS) {
      this.rateLimits.set(universityId, {
        remaining: this.rateLimitPerMinute - 1,
        resetAt: new Date(now.getTime() + this.RATE_LIMIT_WINDOW_MS),
        requests: 1,
        windowStart: now,
      });
      return;
    }

    if (state.remaining <= 0) {
      const waitMs = state.resetAt.getTime() - now.getTime();
      this.logger.warn(`Rate limit hit for university ${universityId}, waiting ${waitMs}ms`);
      throw new Error(`Rate limit exceeded. Resets at ${state.resetAt.toISOString()}`);
    }

    state.remaining -= 1;
    state.requests += 1;
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt >= this.MAX_RETRIES) throw error;

      const isRetryable = error.status === 429 || error.status === 500 || error.status === 529;
      if (!isRetryable) throw error;

      const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
      this.logger.warn(`Retry ${attempt + 1}/${this.MAX_RETRIES} after ${delay}ms: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, attempt + 1);
    }
  }

  private async makeRequest(body: ClaudeRequest): Promise<ClaudeResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error(`Claude API error: ${response.status} - ${errorBody}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json() as Promise<ClaudeResponse>;
  }

  private async makeStreamRequest(body: ClaudeRequest): Promise<ReadableStream> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ ...body, stream: true }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error(`Claude API stream error: ${response.status} - ${errorBody}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.body!;
  }

  private formatCourseContext(contextMaterials?: string[]): string {
    return buildGroundingBlock(contextMaterials);
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const start = Date.now();
    await this.checkRateLimit(input.universityId);

    const systemPrompt = input.courseCode
      ? `You are an AI tutor for course ${input.courseCode}. Help students learn effectively.`
      : 'You are a helpful AI tutor. Help students learn effectively.';

    const promptWithCourse = input.prompt + this.formatCourseContext(input.contextMaterials);

    const result = await this.retryWithBackoff(() =>
      this.makeRequest({
        model: this.defaultModel,
        max_tokens: input.maxTokens ?? 2048,
        temperature: input.temperature ?? 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: promptWithCourse }],
      }),
    );

    return {
      text: result.content[0]?.text ?? '',
      tokensUsed: result.usage.input_tokens + result.usage.output_tokens,
      model: result.model,
      provider: AIProvider.CLAUDE,
      latencyMs: Date.now() - start,
    };
  }

  async generateWithSystemPrompt(input: GenerateWithSystemPromptInput): Promise<GenerateTextOutput> {
    const start = Date.now();
    await this.checkRateLimit(input.universityId);

    const messages: ClaudeMessage[] = input.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const result = await this.retryWithBackoff(() =>
      this.makeRequest({
        model: this.defaultModel,
        max_tokens: input.maxTokens ?? 2048,
        temperature: input.temperature ?? 0.7,
        system: input.systemPrompt,
        messages,
      }),
    );

    return {
      text: result.content[0]?.text ?? '',
      tokensUsed: result.usage.input_tokens + result.usage.output_tokens,
      model: result.model,
      provider: AIProvider.CLAUDE,
      latencyMs: Date.now() - start,
    };
  }

  async *streamResponse(input: StreamResponseInput): AsyncGenerator<StreamChunk> {
    await this.checkRateLimit(input.universityId);

    const systemPrompt = input.systemPrompt ?? (
      input.courseCode
        ? `You are an AI tutor for course ${input.courseCode}. Help students learn effectively.`
        : 'You are a helpful AI tutor.'
    );

    const promptWithCourse = input.prompt + this.formatCourseContext(input.contextMaterials);

    const body: ClaudeRequest = {
      model: this.defaultModel,
      max_tokens: input.maxTokens ?? 2048,
      temperature: input.temperature ?? 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: promptWithCourse }],
      stream: true,
    };

    const stream = await this.makeStreamRequest(body);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let totalOutputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              yield { text: '', done: true, tokensUsed: totalOutputTokens };
              return;
            }

            try {
              const event: ClaudeStreamEvent = JSON.parse(data);

              if (event.type === 'content_block_delta' && event.delta?.text) {
                yield { text: event.delta.text, done: false };
              }

              if (event.type === 'message_delta' && event.message) {
                totalOutputTokens = event.message.usage.output_tokens;
              }

              if (event.type === 'message_stop') {
                yield { text: '', done: true, tokensUsed: totalOutputTokens };
                return;
              }
            } catch {}
          }
        }
      }

      yield { text: '', done: true, tokensUsed: totalOutputTokens };
    } finally {
      reader.releaseLock();
    }
  }

  async summarize(input: SummarizeInput): Promise<SummarizeOutput> {
    const systemPrompt = `You are an academic summarizer. Summarize the following text clearly and concisely.
${input.maxLength ? `Keep the summary under ${input.maxLength} words.` : ''}
${ANTI_HALLUCINATION_RULE}
Also extract 3-7 key topics from the text.
Format your response as:
SUMMARY:
[your summary]
KEY TOPICS:
[topic1, topic2, ...]`;

    const result = await this.generateWithSystemPrompt({
      systemPrompt,
      messages: [{ role: 'user', content: input.text }],
      universityId: input.universityId,
      userId: input.userId,
      courseId: input.courseId,
      temperature: 0.3,
    });

    const summaryMatch = result.text.match(/SUMMARY:\s*([\s\S]*?)(?=KEY TOPICS:|$)/i);
    const topicsMatch = result.text.match(/KEY TOPICS:\s*([\s\S]*?)$/i);

    const summary = summaryMatch?.[1]?.trim() ?? result.text;
    const keyTopics = topicsMatch?.[1]?.split(/[,;]/).map((t) => t.trim()).filter(Boolean) ?? [];

    return { summary, keyTopics, tokensUsed: result.tokensUsed };
  }

  async explain(input: ExplainInput): Promise<ExplainOutput> {
    const difficultyLevel = input.difficulty ?? 'intermediate';
    const courseContext = input.courseCode ? ` for course ${input.courseCode}` : '';
    const materialContext = this.formatCourseContext(input.contextMaterials);

    const systemPrompt = `You are an expert academic tutor explaining concepts${courseContext}.
Explain the topic at a ${difficultyLevel} level.
Provide clear, structured explanations with real-world examples.
${ANTI_HALLUCINATION_RULE}
Format your response as:
EXPLANATION:
[your explanation]
EXAMPLES:
[example1]
[example2]
RELATED:
[related topic 1, related topic 2]`;

    const result = await this.generateWithSystemPrompt({
      systemPrompt,
      messages: [{ role: 'user', content: input.topic + materialContext }],
      universityId: input.universityId,
      userId: input.userId,
      courseId: input.courseId,
      temperature: 0.5,
    });

    const explanationMatch = result.text.match(/EXPLANATION:\s*([\s\S]*?)(?=EXAMPLES:|$)/i);
    const examplesMatch = result.text.match(/EXAMPLES:\s*([\s\S]*?)(?=RELATED:|$)/i);
    const relatedMatch = result.text.match(/RELATED:\s*([\s\S]*?)$/i);

    const explanation = explanationMatch?.[1]?.trim() ?? result.text;
    const examples = examplesMatch?.[1]?.split(/\n/).map((e) => e.replace(/^-\s*/, '').trim()).filter(Boolean) ?? [];
    const relatedTopics = relatedMatch?.[1]?.split(/[,;]/).map((t) => t.trim()).filter(Boolean) ?? [];

    return { explanation, examples, relatedTopics, tokensUsed: result.tokensUsed };
  }

  async generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
    const count = input.count ?? 10;
    const systemPrompt = `Generate exactly ${count} study flashcards from the given content.
Each flashcard should test understanding, not just recall.
${ANTI_HALLUCINATION_RULE}
Format each flashcard as:
CARD [number]:
FRONT: [question or prompt]
BACK: [answer]
DIFFICULTY: [easy/medium/hard]`;

    const result = await this.generateWithSystemPrompt({
      systemPrompt,
      messages: [{ role: 'user', content: input.text }],
      universityId: input.universityId,
      userId: input.userId,
      courseId: input.courseId,
      temperature: 0.6,
    });

    const cards: Array<{ front: string; back: string; difficulty: 'easy' | 'medium' | 'hard'; topic?: string }> = [];
    const cardBlocks = result.text.split(/CARD\s+\d+:/i).filter(Boolean);

    for (const block of cardBlocks) {
      const frontMatch = block.match(/FRONT:\s*(.+?)(?=BACK:|$)/is);
      const backMatch = block.match(/BACK:\s*(.+?)(?=DIFFICULTY:|$)/is);
      const diffMatch = block.match(/DIFFICULTY:\s*(easy|medium|hard)/i);

      if (frontMatch && backMatch) {
        cards.push({
          front: frontMatch[1].trim(),
          back: backMatch[1].trim(),
          difficulty: (diffMatch?.[1]?.toLowerCase() as 'easy' | 'medium' | 'hard') ?? 'medium',
        });
      }
    }

    return { flashcards: cards, tokensUsed: result.tokensUsed };
  }

  async generateCitation(input: GenerateCitationInput): Promise<GenerateCitationOutput> {
    const { source, format } = input;

    const systemPrompt = `Generate a citation in ${format.toUpperCase()} format.
Use ONLY the provided source information.
Never invent authors, years, journals or page numbers that are not given.
If required fields are missing, omit them rather than fabricate them.
Return ONLY the formatted citation, nothing else.`;

    const sourceDescription = [
      source.title && `Title: ${source.title}`,
      source.authors?.length && `Authors: ${source.authors.join(', ')}`,
      source.year && `Year: ${source.year}`,
      source.journal && `Journal: ${source.journal}`,
      source.volume && `Volume: ${source.volume}`,
      source.issue && `Issue: ${source.issue}`,
      source.pages && `Pages: ${source.pages}`,
      source.publisher && `Publisher: ${source.publisher}`,
      source.url && `URL: ${source.url}`,
    ].filter(Boolean).join('\n');

    const result = await this.generateWithSystemPrompt({
      systemPrompt,
      messages: [{ role: 'user', content: sourceDescription }],
      universityId: input.universityId,
      userId: input.userId,
      temperature: 0.1,
      maxTokens: 256,
    });

    return { citation: result.text.trim(), format };
  }

  async reviewCV(input: ReviewCVInput): Promise<ReviewCVOutput> {
    const targetContext = input.targetRole ? ` for the role of ${input.targetRole}` : '';
    const industryContext = input.industry ? ` in the ${input.industry} industry` : '';

    const systemPrompt = `You are an expert career advisor reviewing a student's CV${targetContext}${industryContext}.
Analyze the CV thoroughly and provide:
1. An overall score out of 100
2. Key strengths
3. Areas for improvement
4. Specific suggestions
5. Optionally, rewritten sections for the weakest parts

Format your response as:
SCORE: [number]
STRENGTHS:
[strength1]
[strength2]
IMPROVEMENTS:
[improvement1]
[improvement2]
SUGGESTIONS:
[suggestion1]
[suggestion2]
REWRITTEN:
[Section Name]: [rewritten content]
---`;

    const result = await this.generateWithSystemPrompt({
      systemPrompt,
      messages: [{ role: 'user', content: input.cvText }],
      universityId: input.universityId,
      userId: input.userId,
      temperature: 0.4,
      maxTokens: 3000,
    });

    const scoreMatch = result.text.match(/SCORE:\s*(\d+)/i);
    const strengthsMatch = result.text.match(/STRENGTHS:\s*([\s\S]*?)(?=IMPROVEMENTS:|$)/i);
    const improvementsMatch = result.text.match(/IMPROVEMENTS:\s*([\s\S]*?)(?=SUGGESTIONS:|$)/i);
    const suggestionsMatch = result.text.match(/SUGGESTIONS:\s*([\s\S]*?)(?=REWRITTEN:|$)/i);
    const rewrittenMatch = result.text.match(/REWRITTEN:\s*([\s\S]*?)$/i);

    const rewrittenSections: Record<string, string> = {};
    if (rewrittenMatch?.[1]) {
      const sections = rewrittenMatch[1].split('---').filter(Boolean);
      for (const section of sections) {
        const colonIdx = section.indexOf(':');
        if (colonIdx > 0) {
          const name = section.slice(0, colonIdx).trim();
          const content = section.slice(colonIdx + 1).trim();
          if (name && content) rewrittenSections[name] = content;
        }
      }
    }

    return {
      score: parseInt(scoreMatch?.[1] ?? '0', 10),
      strengths: strengthsMatch?.[1]?.split(/\n/).map((s) => s.replace(/^-\s*/, '').trim()).filter(Boolean) ?? [],
      improvements: improvementsMatch?.[1]?.split(/\n/).map((s) => s.replace(/^-\s*/, '').trim()).filter(Boolean) ?? [],
      suggestions: suggestionsMatch?.[1]?.split(/\n/).map((s) => s.replace(/^-\s*/, '').trim()).filter(Boolean) ?? [],
      rewrittenSections: Object.keys(rewrittenSections).length ? rewrittenSections : undefined,
      tokensUsed: result.tokensUsed,
    };
  }

  async generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput> {
    const toneMap = { professional: 'professional and confident', enthusiastic: 'enthusiastic and passionate', formal: 'formal and traditional' };
    const tone = toneMap[input.tone ?? 'professional'];

    const systemPrompt = `You are an expert cover letter writer.
Write a ${tone} cover letter for a student applying for the ${input.roleTitle} position at ${input.companyName}.
Use information from the provided CV to tailor the letter.
The letter should be 3-4 paragraphs, demonstrate knowledge of the company, and highlight relevant skills.
Return ONLY the cover letter text.`;

    const result = await this.generateWithSystemPrompt({
      systemPrompt,
      messages: [
        { role: 'user', content: `CV:\n${input.cvText}` },
        { role: 'user', content: `Job Description:\n${input.jobDescription}` },
      ],
      universityId: input.universityId,
      userId: input.userId,
      temperature: 0.7,
      maxTokens: 2000,
    });

    return { coverLetter: result.text.trim(), tokensUsed: result.tokensUsed };
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.debug('ANTHROPIC_API_KEY not set — Claude is unavailable');
      return false;
    }
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.defaultModel,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });
      return response.ok || response.status === 400;
    } catch {
      return false;
    }
  }

  async getRateLimit(universityId: string): Promise<{ remaining: number; resetAt: Date }> {
    const state = this.rateLimits.get(universityId);
    if (!state) {
      return { remaining: this.rateLimitPerMinute, resetAt: new Date(Date.now() + this.RATE_LIMIT_WINDOW_MS) };
    }
    return { remaining: Math.max(0, state.remaining), resetAt: state.resetAt };
  }
}
