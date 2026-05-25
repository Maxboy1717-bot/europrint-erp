/**
 * @module ai-marketing.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const AiMarketingGenerateContentDtoSchema = z.object({
  contentType: z.enum(['POST', 'ARTICLE', 'CAPTION', 'NEWSLETTER']),
  topic: z.string().min(1).max(500),
  targetAudience: z.string().min(1).max(500),
  language: z.enum(['uz', 'ru', 'en']),
});
export type AiMarketingGenerateContentDto = z.infer<typeof AiMarketingGenerateContentDtoSchema>;

export const AiMarketingAdCopyDtoSchema = z.object({
  product: z.string().min(1).max(500),
  targetAudience: z.string().min(1).max(500),
  platform: z.enum(['INSTAGRAM', 'TELEGRAM', 'GOOGLE', 'FACEBOOK']),
  budget: z.number().positive(),
});
export type AiMarketingAdCopyDto = z.infer<typeof AiMarketingAdCopyDtoSchema>;

export const AiMarketingSentimentDtoSchema = z.object({
  reviews: z.array(z.string().min(1)).min(1).max(500),
});
export type AiMarketingSentimentDto = z.infer<typeof AiMarketingSentimentDtoSchema>;

export const AiMarketingSeoOptimizeDtoSchema = z.object({
  pageTitle: z.string().min(1).max(200),
  pageContent: z.string().min(1).max(50_000),
  targetKeywords: z.array(z.string().min(1)).min(1).max(20),
});
export type AiMarketingSeoOptimizeDto = z.infer<typeof AiMarketingSeoOptimizeDtoSchema>;
