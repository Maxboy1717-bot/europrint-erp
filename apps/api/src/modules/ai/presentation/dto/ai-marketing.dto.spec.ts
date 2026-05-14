/**
 * @module ai-marketing.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  AiMarketingGenerateContentDtoSchema,
  AiMarketingAdCopyDtoSchema,
  AiMarketingSentimentDtoSchema,
  AiMarketingSeoOptimizeDtoSchema,
} from './ai-marketing.dto';

describe('AiMarketingGenerateContentDtoSchema', () => {
  const valid = { contentType: 'POST' as const, topic: 'Printing', targetAudience: 'SMBs', language: 'uz' as const };

  it('accepts valid input', () => {
    const result = AiMarketingGenerateContentDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid contentType', () => {
    const result = AiMarketingGenerateContentDtoSchema.safeParse({ ...valid, contentType: 'VIDEO' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid language', () => {
    const result = AiMarketingGenerateContentDtoSchema.safeParse({ ...valid, language: 'de' });
    expect(result.success).toBe(false);
  });

  it('rejects empty topic', () => {
    const result = AiMarketingGenerateContentDtoSchema.safeParse({ ...valid, topic: '' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid contentTypes', () => {
    for (const contentType of ['POST', 'ARTICLE', 'CAPTION', 'NEWSLETTER'] as const) {
      const result = AiMarketingGenerateContentDtoSchema.safeParse({ ...valid, contentType });
      expect(result.success).toBe(true);
    }
  });
});

describe('AiMarketingAdCopyDtoSchema', () => {
  const valid = { product: 'Banner Print', targetAudience: 'Businesses', platform: 'INSTAGRAM' as const, budget: 500 };

  it('accepts valid input', () => {
    const result = AiMarketingAdCopyDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid platform', () => {
    const result = AiMarketingAdCopyDtoSchema.safeParse({ ...valid, platform: 'TWITTER' });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive budget', () => {
    const result = AiMarketingAdCopyDtoSchema.safeParse({ ...valid, budget: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts all valid platforms', () => {
    for (const platform of ['INSTAGRAM', 'TELEGRAM', 'GOOGLE', 'FACEBOOK'] as const) {
      const result = AiMarketingAdCopyDtoSchema.safeParse({ ...valid, platform });
      expect(result.success).toBe(true);
    }
  });
});

describe('AiMarketingSentimentDtoSchema', () => {
  it('accepts valid reviews array', () => {
    const result = AiMarketingSentimentDtoSchema.safeParse({ reviews: ['Great product!', 'Very satisfied'] });
    expect(result.success).toBe(true);
  });

  it('rejects empty reviews array', () => {
    const result = AiMarketingSentimentDtoSchema.safeParse({ reviews: [] });
    expect(result.success).toBe(false);
  });

  it('rejects empty string in reviews', () => {
    const result = AiMarketingSentimentDtoSchema.safeParse({ reviews: [''] });
    expect(result.success).toBe(false);
  });
});

describe('AiMarketingSeoOptimizeDtoSchema', () => {
  const valid = {
    pageTitle: 'EuroPrint Services',
    pageContent: 'We offer high quality printing services.',
    targetKeywords: ['printing', 'Tashkent'],
  };

  it('accepts valid SEO data', () => {
    const result = AiMarketingSeoOptimizeDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects empty targetKeywords', () => {
    const result = AiMarketingSeoOptimizeDtoSchema.safeParse({ ...valid, targetKeywords: [] });
    expect(result.success).toBe(false);
  });

  it('rejects more than 20 keywords', () => {
    const result = AiMarketingSeoOptimizeDtoSchema.safeParse({
      ...valid,
      targetKeywords: Array.from({ length: 21 }, (_, i) => `keyword${i}`),
    });
    expect(result.success).toBe(false);
  });
});
