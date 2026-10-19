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

interface GeminiContent {
  parts: Array<{ text: string }>;
  role: 'user' | 'model';
}

interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: { parts: Array<{ text: string }> };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
    thinkingConfig?: { thinkingBudget?: number; includeThoughts?: boolean };
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }>; role: string };
    finishReason: string;
  }>;
  usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
  promptFeedback?: { blockReason?: string };
}

interface GeminiStreamChunk {
  candidates?: Array<{
    content: { parts: Array<{ text: string }>; role: string };
    finishReason?: string;
  }>;
  usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
}

interface RateLimitState {
  remaining: number;
  resetAt: Date;
  requests: number;
  windowStart: Date;
}

@Injectable()
export class GeminiProvider extends IAiProvider {
  readonly provider = AIProvider.GEMINI;
  readonly name = 'Gemini (Google)';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly rateLimits = new Map<string, RateLimitState>();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly RATE_LIMIT_WINDOW_MS = 60_000;
  private readonly DEFAULT_MAX_REQUESTS_PER_MINUTE = 60;

  constructor(private readonly config: ConfigService) {
    super();
  }

  private get apiKey(): string {
    return this.config.get<string>('GEMINI_API_KEY', '');
  }

  private get defaultModel(): string {
    return this.config.get<string>('GEMINI_MODEL', 'gemini-2.0-flash');
  }

  private get rateLimitPerMinute(): number {
    return this.config.get<number>('GEMINI_RATE_LIMIT_RPM', this.DEFAULT_MAX_REQUESTS_PER_MINUTE);
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

      // 429 = rate limit / quota exhausted. Retrying immediately won't clear it
      // and would only stall the request before we fall back to the next
      // provider, so fail fast. Transient 5xx errors are still worth a retry.
      const isRetryable = error.status === 500 || error.status === 503;
      if (!isRetryable) throw error;

      const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
      this.logger.warn(`Retry ${attempt + 1}/${this.MAX_RETRIES} after ${delay}ms: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, attempt + 1);
    }
  }

  /**
   * Joins every text-bearing part of the first candidate, skipping internal
   * thinking parts. gemini-3.x often emits a thought part first; reading only
   * parts[0].text returned '' and produced empty flashcards/summaries.
   */
  private extractCandidateText(result: any): string {
    const parts = result?.candidates?.[0]?.content?.parts ?? [];
    return parts
      .filter((p: any) => p?.text && p?.thought !== true)
      .map((p: any) => p.text as string)
      .join('');
  }

  private getModelUrl(model?: string): string {
    return `${this.baseUrl}/${model ?? this.defaultModel}`;
  }

  /**
   * Gemini 2.5+/3.x bill "thinking" tokens against maxOutputTokens, which
   * silently truncates the answer (flashcards came back empty, citations cut
   * off). GEMINI_THINKING_BUDGET=0 turns thinking off unless a budget is set.
   */
  private prepare(body: GeminiRequest): GeminiRequest {
    const budget = this.config.get<number>('GEMINI_THINKING_BUDGET', 0);
    body.generationConfig = {
      ...body.generationConfig,
      thinkingConfig: { thinkingBudget: budget },
    };
    return body;
  }

  private async makeRequest(body: GeminiRequest, model?: string): Promise<GeminiResponse> {
    const url = `${this.getModelUrl(model)}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.prepare(body)),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error(`Gemini API error: ${response.status} - ${errorBody}`);
      (error as any).status = response.status;
      throw error;
    }

    const result: GeminiResponse = await response.json();

    if (result.promptFeedback?.blockReason) {
      throw new Error(`Content blocked: ${result.promptFeedback.blockReason}`);
    }

    return result;
  }

  private async makeStreamRequest(body: GeminiRequest, model?: string): Promise<ReadableStream> {
    const url = `${this.getModelUrl(model)}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.prepare(body)),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error(`Gemini stream error: ${response.status} - ${errorBody}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.body!;
  }

  private buildContents(messages: Array<{ role: 'user' | 'assistant'; content: string }>): GeminiContent[] {
    return messages
      .filter((m) => typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({
        parts: [{ text: m.content.trim() }],
        role: m.role === 'assistant' ? 'model' : 'user',
      }));
  }

  private formatCourseContext(contextMaterials?: string[]): string {
    return buildGroundingBlock(contextMaterials);
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const start = Date.now();
    await this.checkRateLimit(input.universityId);

    const systemInstruction = input.courseCode
      ? `You are an AI tutor for course ${input.courseCode}. Help students learn effectively.`
      : 'You are a helpful AI tutor. Help students learn effectively.';

    const promptWithCourse = input.prompt + this.formatCourseContext(input.contextMaterials);

    const result = await this.retryWithBackoff(() =>
      this.makeRequest({
        contents: [{ parts: [{ text: promptWithCourse }], role: 'user' }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: input.temperature ?? 0.7,
          maxOutputTokens: input.maxTokens ?? 2048,
        },
      }),
    );

    const text = this.extractCandidateText(result);
    const tokensUsed = result.usageMetadata?.totalTokenCount ?? 0;

    return {
      text,
      tokensUsed,
      model: this.defaultModel,
      provider: AIProvider.GEMINI,
      latencyMs: Date.now() - start,
    };
  }

  async generateWithSystemPrompt(input: GenerateWithSystemPromptInput): Promise<GenerateTextOutput> {
    const start = Date.now();
    await this.checkRateLimit(input.universityId);

    let contents = this.buildContents(input.messages);
    if (contents.length === 0) {
      contents = [{ parts: [{ text: 'Continue' }], role: 'user' }];
    }

    const result = await this.retryWithBackoff(() =>
      this.makeRequest({
        contents,
        systemInstruction: { parts: [{ text: input.systemPrompt }] },
        generationConfig: {
          temperature: input.temperature ?? 0.7,
          maxOutputTokens: input.maxTokens ?? 2048,
        },
      }),
    );

    const text = this.extractCandidateText(result);
    const tokensUsed = result.usageMetadata?.totalTokenCount ?? 0;

    return {
      text,
      tokensUsed,
      model: this.defaultModel,
      provider: AIProvider.GEMINI,
      latencyMs: Date.now() - start,
    };
  }

  async *streamResponse(input: StreamResponseInput): AsyncGenerator<StreamChunk> {
    await this.checkRateLimit(input.universityId);

    const systemInstruction = input.systemPrompt ?? (
      input.courseCode
        ? `You are an AI tutor for course ${input.courseCode}. Help students learn effectively.`
        : 'You are a helpful AI tutor.'
    );

    const promptWithCourse = input.prompt + this.formatCourseContext(input.contextMaterials);

    const body: GeminiRequest = {
      contents: [{ parts: [{ text: promptWithCourse }], role: 'user' }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: input.temperature ?? 0.7,
        maxOutputTokens: input.maxTokens ?? 2048,
      },
    };

    const stream = await this.makeStreamRequest(body);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let totalTokens = 0;

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
            if (!data) continue;

            try {
              const event: GeminiStreamChunk = JSON.parse(data);
              const text = this.extractCandidateText(event);
              if (text) {
                yield { text, done: false };
              }

              if (event.usageMetadata) {
                totalTokens = event.usageMetadata.totalTokenCount;
              }

              if (event.candidates?.[0]?.finishReason) {
                yield { text: '', done: true, tokensUsed: totalTokens };
                return;
              }
            } catch {}
          }
        }
      }

      yield { text: '', done: true, tokensUsed: totalTokens };
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
Never invent authors, titles, page numbers or other metadata not present above.
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
      this.logger.warn('GEMINI_API_KEY is not configured; Gemini provider unavailable');
      return false;
    }
    try {
      const url = `${this.getModelUrl()}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ping' }], role: 'user' }],
          generationConfig: { maxOutputTokens: 8, thinkingConfig: { thinkingBudget: 0 } },
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
