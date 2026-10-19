import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AIService } from '../ai-tutor/services/ai.service';

export interface StudyRoadmap {
  subject: string;
  weeks: number;
  roadmap: string;
  plan: Array<{ week: string; focus: string; tasks: string[] }>;
}

export interface ExamQuestion {
  question: string;
  answer: string;
}

export interface ExamQuestionSet {
  topic: string;
  difficulty: string;
  questions: ExamQuestion[];
}

export interface BusinessPlan {
  idea: string;
  plan: string;
  sections: Array<{ title: string; body: string }>;
}

export interface PitchDeck {
  business: string;
  slides: Array<{ title: string; bullets: string[] }>;
}

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);

  constructor(private readonly ai: AIService) {}

  private async generate(
    universityId: string,
    userId: string,
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 2048,
    temperature = 0.6,
  ): Promise<string> {
    const result = await this.ai.generateWithSystemPrompt({
      systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      universityId,
      userId,
      maxTokens,
      temperature,
    });
    return result.text ?? '';
  }

  async studyRoadmap(
    universityId: string,
    userId: string,
    subject: string,
    options?: { weeks?: number; level?: string; hoursPerWeek?: number },
  ): Promise<StudyRoadmap> {
    if (!subject?.trim()) throw new BadRequestException('A subject or course is required');

    const weeks = Math.min(Math.max(options?.weeks ?? 4, 1), 16);
    const level = options?.level ?? 'intermediate';
    const hours = options?.hoursPerWeek ?? 6;

    const systemPrompt = `You are an academic study coach. Produce a realistic, week-by-week study roadmap.
Assume the student can study about ${hours} hours per week and is at ${level} level.
Format your answer EXACTLY as:
WEEK n: <focus of that week>
- <task>
- <task>
- <task>
Repeat for exactly ${weeks} weeks. Use only real, useful study actions.`;

    const roadmap = await this.generate(
      universityId,
      userId,
      systemPrompt,
      `Build a ${weeks}-week study roadmap for: ${subject}`,
      2500,
      0.5,
    );

    const plan: Array<{ week: string; focus: string; tasks: string[] }> = [];
    const blocks = roadmap.split(/\n(?=WEEK\s+\d+\s*:)/i);
    for (const block of blocks) {
      const header = block.match(/WEEK\s+(\d+)\s*:\s*(.*)/i);
      if (!header) continue;
      const tasks = block
        .split('\n')
        .slice(1)
        .map((l) => l.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean);
      plan.push({ week: `Week ${header[1]}`, focus: (header[2] ?? '').trim(), tasks });
    }

    return { subject, weeks, roadmap, plan };
  }

  async examQuestions(
    universityId: string,
    userId: string,
    topic: string,
    options?: { count?: number; difficulty?: string },
  ): Promise<ExamQuestionSet> {
    if (!topic?.trim()) throw new BadRequestException('A topic is required');

    const count = Math.min(Math.max(options?.count ?? 5, 1), 15);
    const difficulty = options?.difficulty ?? 'medium';

    const systemPrompt = `You are an exam setter. Create exactly ${count} ${difficulty}-difficulty exam questions
WITH worked answers for the given topic.
Format EXACTLY as:
Q: <question>
A: <concise model answer>
Repeat for all ${count} questions.`;

    const text = await this.generate(
      universityId,
      userId,
      systemPrompt,
      `Topic: ${topic}`,
      2500,
      0.5,
    );

    const questions: ExamQuestion[] = [];
    const blocks = text.split(/\n(?=Q\s*:)/i);
    for (const block of blocks) {
      const q = block.match(/Q\s*:\s*([\s\S]*?)(?=\nA\s*:|$)/i);
      const a = block.match(/A\s*:\s*([\s\S]*)/i);
      if (q?.[1]?.trim()) {
        questions.push({ question: q[1].trim(), answer: (a?.[1] ?? '').trim() });
      }
    }

    return { topic, difficulty, questions };
  }

  async businessPlan(
    universityId: string,
    userId: string,
    idea: string,
    options?: { industry?: string; targetMarket?: string },
  ): Promise<BusinessPlan> {
    if (!idea?.trim()) throw new BadRequestException('A business idea is required');

    const industry = options?.industry ?? 'general';
    const market = options?.targetMarket ?? 'university students';

    const systemPrompt = `You are a startup advisor. Write a concise but complete business plan.
Cover these sections, each starting with a heading on its own line ending with ':'
EXECUTIVE SUMMARY:
MARKET ANALYSIS:
VALUE PROPOSITION:
REVENUE MODEL:
GO-TO-MARKET:
MILESTONES:
RISKS:
Be specific and practical. Avoid generic filler.`;

    const plan = await this.generate(
      universityId,
      userId,
      systemPrompt,
      `Business idea: ${idea}\nIndustry: ${industry}\nTarget market: ${market}`,
      3000,
      0.6,
    );

    const sections: Array<{ title: string; body: string }> = [];
    const headings = Array.from(
      plan.matchAll(/\n?(EXECUTIVE SUMMARY|MARKET ANALYSIS|VALUE PROPOSITION|REVENUE MODEL|GO-TO-MARKET|MILESTONES|RISKS):/gi),
    );
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      const start = (h.index ?? 0) + h[0].length;
      const end = i + 1 < headings.length ? (headings[i + 1].index ?? plan.length) : plan.length;
      sections.push({ title: h[1].trim(), body: plan.slice(start, end).trim() });
    }

    return { idea, plan, sections };
  }

  async pitchDeck(
    universityId: string,
    userId: string,
    business: string,
    options?: { audience?: string },
  ): Promise<PitchDeck> {
    if (!business?.trim()) throw new BadRequestException('A business is required');

    const audience = options?.audience ?? 'investors';

    const systemPrompt = `You are a pitch coach. Write a 10-slide pitch deck for ${audience}.
Format EXACTLY as:
SLIDE <n>: <title>
- <bullet>
- <bullet>
Use 3-4 punchy bullets per slide. Slides should cover: title, problem, solution,
market, product, business model, traction, competition, team, the ask.`;

    const text = await this.generate(
      universityId,
      userId,
      systemPrompt,
      `Business: ${business}`,
      2500,
      0.6,
    );

    const slides: Array<{ title: string; bullets: string[] }> = [];
    const blocks = text.split(/\n(?=SLIDE\s+\d+\s*:)/i);
    for (const block of blocks) {
      const header = block.match(/SLIDE\s+\d+\s*:\s*(.*)/i);
      if (!header) continue;
      const bullets = block
        .split('\n')
        .slice(1)
        .map((l) => l.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean);
      slides.push({ title: header[1].trim(), bullets });
    }

    return { business, slides };
  }
}
