/**
 * @module ai-interview-v2-ai.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { errMsg } from '../hr-v2-error';
import { GoogleGenerativeAI, type RequestOptions } from '@google/generative-ai';
import { fallbackAnalysis, fallbackEvaluation } from './ai-interview-v2.utils';
import { Result, Ok, safeCall } from '@common/result';

interface ScoredAnswer {
  question: string;
  answer: string;
  score: number;
}

@Injectable()
export class AiInterviewAiService {
  private readonly logger = new Logger(AiInterviewAiService.name);
  private gemini: GoogleGenerativeAI | null = null;
  private geminiBaseUrl: string | undefined;

  constructor(private readonly cfg: ConfigService) {}

  onModuleInit() {
    const apiKey = this.cfg.get<string>('AI_INTEGRATIONS_GEMINI_API_KEY');
    const baseUrl = this.cfg.get<string>('AI_INTEGRATIONS_GEMINI_BASE_URL');
    if (apiKey) {
      try {
        this.gemini = new GoogleGenerativeAI(apiKey);
        this.geminiBaseUrl = baseUrl;
        this.logger.log('Gemini AI initialized');
      } catch (err) {
        this.logger.warn(`Gemini init failed: ${errMsg(err as Error)}`);
      }
    } else {
      this.logger.warn('Gemini env vars not set — using fallback scoring');
    }
  }

  getRequestOptions(): RequestOptions | undefined {
    return this.geminiBaseUrl ? { baseUrl: this.geminiBaseUrl } : undefined;
  }

  async analyzeAnswer(
    answer: string,
    question: string,
    language: string,
  ): Promise<Result<Record<string, unknown>>> {
    if (!this.gemini) return Ok(fallbackAnalysis(answer));

    const langName = language === 'ru' ? 'Russian' : language === 'en' ? 'English' : 'Uzbek';
    const prompt = `You are an HR interview evaluator. Evaluate this interview answer.

Question: ${question}
Candidate's Answer: ${answer}
Language to respond in: ${langName}

Provide a JSON response with these fields:
- score: number from 1-10 (10 being best)
- feedback: 1-2 sentences of constructive feedback in ${langName}
- keywords: array of 3-5 key positive concepts from the answer

Respond ONLY with valid JSON, no markdown.`;

    const gemini = this.gemini;
    const r = await safeCall(async () => {
      const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' }, this.getRequestOptions());
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonText = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(jsonText);
      return {
        score: Math.max(1, Math.min(10, Number(parsed.score) || 5)),
        feedback: String(parsed.feedback || ''),
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      };
    });
    if (!r.ok) {
      this.logger.warn(`Gemini analysis failed: ${r.error.message}, using fallback`);
      return Ok(fallbackAnalysis(answer));
    }
    return r;
  }

  async generateFinalEvaluation(
    answers: ScoredAnswer[],
    language: string,
  ): Promise<Result<Record<string, unknown>>> {
    if (!this.gemini || answers.length === 0) return Ok(fallbackEvaluation(answers));

    const langName = language === 'ru' ? 'Russian' : language === 'en' ? 'English' : 'Uzbek';
    const qa = (Array.isArray(answers) ? answers : []).map((a, i) =>
      `Q${i + 1}: ${a.question}\nA: ${a.answer || '(no answer)'}\nScore: ${a.score}/10`
    ).join('\n\n');

    const prompt = `You are an HR manager evaluating a job interview. Based on these Q&A pairs, provide a final evaluation.

${qa}

Respond in ${langName} with JSON containing:
- strengths: array of 2-3 key strengths observed
- weaknesses: array of 1-2 improvement areas
- summary: 2-3 sentence overall summary
- recommendation: one of "HIRE", "CONSIDER", or "REJECT" based on answers

Respond ONLY with valid JSON, no markdown.`;

    const gemini = this.gemini;
    const r = await safeCall(async () => {
      const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' }, this.getRequestOptions());
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonText = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(jsonText);
      return {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        summary: String(parsed.summary || ''),
        recommendation: ['HIRE', 'CONSIDER', 'REJECT'].includes(parsed.recommendation)
          ? parsed.recommendation
          : 'CONSIDER',
      };
    });
    if (!r.ok) {
      this.logger.warn(`Gemini final eval failed: ${r.error.message}`);
      return Ok(fallbackEvaluation(answers));
    }
    return r;
  }
}
