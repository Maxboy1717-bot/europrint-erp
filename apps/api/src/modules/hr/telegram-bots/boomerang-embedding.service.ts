/**
 * @module boomerang-embedding.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { errMsg } from '../hr-v2-error';

interface EmbeddingCache {
  vector: number[];
  text: string;
  expiresAt: number;
}

@Injectable()
export class BoomerangEmbeddingService {
  private readonly logger = new Logger(BoomerangEmbeddingService.name);
  private readonly cache = new Map<string, EmbeddingCache>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000;
  private readonly SIMILARITY_THRESHOLD = 0.72;
  private readonly MODEL = 'text-embedding-3-small';

  constructor(private readonly cfg: ConfigService) {}

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  private buildCandidateText(candidate: Record<string, unknown>): string {
    return [
      String(candidate['position_hint'] ?? ''),
      String(candidate['department_hint'] ?? ''),
      String(candidate['skills_hint'] ?? ''),
      String(candidate['name'] ?? ''),
    ].filter(Boolean).join(' ').trim();
  }

  private buildVacancyText(vacancy: { title: string; department?: string; requiredSkills?: string; tags?: string }): string {
    return [
      vacancy.title,
      vacancy.department ?? '',
      vacancy.requiredSkills ?? '',
      vacancy.tags ?? '',
    ].filter(Boolean).join(' ').trim();
  }

  private async getEmbedding(text: string): Promise<number[] | null> {
    const cacheKey = text.slice(0, 200);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.vector;

    const apiKey = this.cfg.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.debug('OPENAI_API_KEY not set — embedding skipped');
      return null;
    }

    try {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey });
      const resp = await client.embeddings.create({ model: this.MODEL, input: text.slice(0, 8000) });
      const vector = resp.data[0]?.embedding ?? null;
      if (vector) {
        this.cache.set(cacheKey, { vector, text, expiresAt: Date.now() + this.CACHE_TTL_MS });
        this.pruneCache();
      }
      return vector;
    } catch (err) {
      this.logger.warn(`Embedding API error: ${errMsg(err)}`);
      return null;
    }
  }

  private pruneCache(): void {
    if (this.cache.size <= 1000) return;
    const now = Date.now();
    for (const [k, v] of this.cache) {
      if (v.expiresAt < now) this.cache.delete(k);
      if (this.cache.size <= 800) break;
    }
  }

  async rankCandidates(
    candidates: Record<string, unknown>[],
    vacancy: { title: string; department?: string; requiredSkills?: string; tags?: string },
  ): Promise<{ candidate: Record<string, unknown>; score: number }[]> {
    const vacancyText = this.buildVacancyText(vacancy);
    const vacancyEmbedding = await this.getEmbedding(vacancyText);

    if (!vacancyEmbedding) {
      this.logger.debug('No vacancy embedding — returning all candidates (keyword fallback handled upstream)');
      return candidates.map(c => ({ candidate: c, score: 1.0 }));
    }

    const ranked: { candidate: Record<string, unknown>; score: number }[] = [];
    for (const candidate of candidates) {
      const text = this.buildCandidateText(candidate);
      if (!text.trim()) continue;

      const emb = await this.getEmbedding(text);
      if (!emb) {
        ranked.push({ candidate, score: 0.5 });
        continue;
      }
      const score = this.cosineSimilarity(vacancyEmbedding, emb);
      if (score >= this.SIMILARITY_THRESHOLD) {
        ranked.push({ candidate, score });
      }
    }

    return ranked.sort((a, b) => b.score - a.score);
  }

  clearCache(): void {
    this.cache.clear();
  }
}
