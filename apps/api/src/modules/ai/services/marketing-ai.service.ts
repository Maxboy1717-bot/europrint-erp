import { AI_SHORT_MAX_TOKENS, AI_MAX_TOKENS_STANDARD, MAX_SHORT_TEXT } from '@common/constants/app.constants';
/**
 * Marketing AI Service — Content generation, SEO, Ad copy, Sentiment analysis
 */
import { Injectable, Logger } from '@nestjs/common';
import { isErr, Err, safeJsonParse, safeCall, Result, AppError } from '@common/result';
import { AiRouterService } from '../application/services/ai-router.service';

@Injectable()
export class MarketingAiService {
  private readonly logger = new Logger(MarketingAiService.name);

  constructor(private readonly ai: AiRouterService) {}

  async generateContent(
    contentType: 'POST' | 'ARTICLE' | 'CAPTION' | 'NEWSLETTER',
    topic: string,
    targetAudience: string,
    language: 'uz' | 'ru' | 'en',
    userId: number,
  ): Promise<Result<{ title: string; body: string; hashtags?: string[] }, AppError>> {
    this.logger.log(`marketing ai: AI tahlil boshlanmoqda`);
    const langMap = { uz: "O'zbek", ru: 'Rus', en: 'Ingliz' };
    const typeMap = {
      POST: 'ijtimoiy tarmoq posti',
      ARTICLE: 'blog maqolasi',
      CAPTION: 'rasm tavsifi (caption)',
      NEWSLETTER: 'email xabarnomasi',
    };

    const prompt = `
EuroPrint bosma mahsulotlar kompaniyasi uchun ${typeMap[contentType]} yozing.

MAVZU: ${topic}
MAQSADLI AUDITORIYA: ${targetAudience}
TIL: ${langMap[language]}

EuroPrint — Toshkent, bosma mahsulotlar, dizayn, brend yechimlar.

JSON formatda:
{
  "title": "...",
  "body": "...",
  "hashtags": ["...", "...", "..."]
}
`;

    const aiResult = await this.ai.call({
      taskType: 'marketing.content_generate',
      prompt,
      maxTokens: 800,
      temperature: 0.8,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return Err(aiResult.error);
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<{ title: string; body: string; hashtags: string[] }>(jsonMatch[0]);
      if (parsed) return { ok: true, data: parsed };
    }

    return { ok: true, data: { title: topic, body: aiResult.data.text, hashtags: [] } };
  }

  async generateAdCopy(
    product: string,
    targetAudience: string,
    platform: 'INSTAGRAM' | 'TELEGRAM' | 'GOOGLE' | 'FACEBOOK',
    budget: number,
    userId: number,
  ): Promise<{ headline: string; description: string; callToAction: string }> {
    this.logger.log(`marketing ai: AI tahlil boshlanmoqda`);
    const prompt = `
EuroPrint reklama matni: "${product}"

PLATFORMA: ${platform}
AUDITORIYA: ${targetAudience}
BYUDJET: ${budget.toLocaleString()} UZS

Qisqa, e'tiborni tortuvchi, harakat sarig'lovchi reklama matni (O'zbek tilida).

JSON formatda:
{
  "headline": "...",
  "description": "...",
  "callToAction": "..."
}
`;

    const aiResult = await this.ai.call({
      taskType: 'marketing.ad_copy',
      prompt,
      maxTokens: AI_MAX_TOKENS_STANDARD,
      temperature: 0.8,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { headline: product, description: '', callToAction: 'Bog\'laning!' };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<{ headline: string; description: string; callToAction: string }>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { headline: product, description: aiResult.data.text, callToAction: 'Bog\'laning!' };
  }

  async analyzeSentiment(
    reviews: string[],
    userId: number,
  ): Promise<{ overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'; score: number; themes: string[]; recommendations: string[] }> {
    this.logger.log(`marketing ai: AI tahlil boshlanmoqda`);
    const prompt = `
EuroPrint mijoz fikrlarini tahlil qiling.

FIKRLAR:
${(Array.isArray(reviews) ? reviews : []).map((r, i) => `${i + 1}. "${r}"`).join('\n')}

JSON formatda:
{
  "overall": "POSITIVE|NEUTRAL|NEGATIVE",
  "score": <0-100>,
  "themes": ["...", "..."],
  "recommendations": ["...", "..."]
}
`;

    const aiResult = await this.ai.call({
      taskType: 'marketing.sentiment_analyze',
      prompt,
      maxTokens: AI_MAX_TOKENS_STANDARD,
      temperature: 0.2,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { overall: 'NEUTRAL', score: 50, themes: [], recommendations: [] };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<{ overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'; score: number; themes: string[]; recommendations: string[] }>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { overall: 'NEUTRAL', score: 50, themes: [], recommendations: [] };
  }

  async optimizeSeo(
    pageTitle: string,
    pageContent: string,
    targetKeywords: string[],
    userId: number,
  ): Promise<{ seoTitle: string; metaDescription: string; suggestedKeywords: string[]; improvements: string[] }> {
    const prompt = `
EuroPrint veb-sahifasi uchun SEO optimizatsiya.

SAHIFA: ${pageTitle}
KALIT SO'ZLAR: ${targetKeywords.join(', ')}
KONTENT (qisqa):
${pageContent.substring(0, MAX_SHORT_TEXT)}

JSON formatda:
{
  "seoTitle": "...",
  "metaDescription": "...",
  "suggestedKeywords": ["...", "...", "..."],
  "improvements": ["...", "...", "..."]
}
`;

    const aiResult = await this.ai.call({
      taskType: 'marketing.seo_optimize',
      prompt,
      maxTokens: AI_SHORT_MAX_TOKENS,
      temperature: 0.5,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { seoTitle: pageTitle, metaDescription: '', suggestedKeywords: targetKeywords, improvements: [] };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<{ seoTitle: string; metaDescription: string; suggestedKeywords: string[]; improvements: string[] }>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { seoTitle: pageTitle, metaDescription: '', suggestedKeywords: targetKeywords, improvements: [] };
  }
}
