export enum AIProvider {
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  NVIDIA = 'nvidia',
  OLLAMA = 'ollama',
  MISTRAL = 'mistral',
}

export enum CitationFormat {
  APA = 'apa',
  MLA = 'mla',
  HARVARD = 'harvard',
}

export enum IntegrityMode {
  EXPLAIN_ONLY = 'explain_only',
  FULL_ASSIST = 'full_assist',
  EXAM_MODE = 'exam_mode',
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateTextInput {
  prompt: string;
  universityId: string;
  userId: string;
  courseId?: string;
  courseCode?: string;
  contextMaterials?: string[];
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateTextOutput {
  text: string;
  tokensUsed: number;
  model: string;
  provider: AIProvider;
  latencyMs: number;
}

export interface GenerateWithSystemPromptInput {
  systemPrompt: string;
  messages: AIMessage[];
  universityId: string;
  userId: string;
  courseId?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface StreamResponseInput {
  prompt: string;
  universityId: string;
  userId: string;
  courseId?: string;
  courseCode?: string;
  contextMaterials?: string[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface StreamChunk {
  text: string;
  done: boolean;
  tokensUsed?: number;
}

export interface SummarizeInput {
  text: string;
  universityId: string;
  userId: string;
  courseId?: string;
  maxLength?: number;
}

export interface SummarizeOutput {
  summary: string;
  keyTopics: string[];
  tokensUsed: number;
}

export interface ExplainInput {
  topic: string;
  universityId: string;
  userId: string;
  courseId?: string;
  courseCode?: string;
  contextMaterials?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface ExplainOutput {
  explanation: string;
  examples: string[];
  relatedTopics: string[];
  tokensUsed: number;
}

export interface Flashcard {
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface GenerateFlashcardsInput {
  text: string;
  universityId: string;
  userId: string;
  courseId?: string;
  count?: number;
}

export interface GenerateFlashcardsOutput {
  flashcards: Flashcard[];
  tokensUsed: number;
}

export interface GenerateCitationInput {
  source: {
    title: string;
    authors?: string[];
    year?: number;
    url?: string;
    journal?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    publisher?: string;
    accessDate?: Date;
  };
  format: CitationFormat;
  universityId: string;
  userId: string;
}

export interface GenerateCitationOutput {
  citation: string;
  format: CitationFormat;
}

export interface ReviewCVInput {
  cvText: string;
  universityId: string;
  userId: string;
  targetRole?: string;
  industry?: string;
}

export interface ReviewCVOutput {
  score: number;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  rewrittenSections?: Record<string, string>;
  tokensUsed: number;
}

export interface GenerateCoverLetterInput {
  cvText: string;
  jobDescription: string;
  companyName: string;
  roleTitle: string;
  universityId: string;
  userId: string;
  tone?: 'professional' | 'enthusiastic' | 'formal';
}

export interface GenerateCoverLetterOutput {
  coverLetter: string;
  tokensUsed: number;
}

export interface AIUsageLog {
  id: string;
  universityId: string;
  userId: string;
  provider: AIProvider;
  method: string;
  courseId?: string;
  tokensUsed: number;
  latencyMs: number;
  cached: boolean;
  integrityMode?: IntegrityMode;
  timestamp: Date;
}

export abstract class IAiProvider {
  abstract readonly provider: AIProvider;
  abstract readonly name: string;

  abstract generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
  abstract generateWithSystemPrompt(input: GenerateWithSystemPromptInput): Promise<GenerateTextOutput>;
  abstract streamResponse(input: StreamResponseInput): AsyncGenerator<StreamChunk>;
  abstract summarize(input: SummarizeInput): Promise<SummarizeOutput>;
  abstract explain(input: ExplainInput): Promise<ExplainOutput>;
  abstract generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput>;
  abstract generateCitation(input: GenerateCitationInput): Promise<GenerateCitationOutput>;
  abstract reviewCV(input: ReviewCVInput): Promise<ReviewCVOutput>;
  abstract generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput>;
  abstract isAvailable(): Promise<boolean>;
  abstract getRateLimit(universityId: string): Promise<{ remaining: number; resetAt: Date }>;
}
