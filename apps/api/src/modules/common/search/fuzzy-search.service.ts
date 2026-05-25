/**
 * fuzzy-search.service.ts — TZ-50 + TZ-51: Fuzzy Search + BM25 / PostgreSQL FTS
 *
 * TZ-50 Levenshtein fuzzy search:
 *   L(i,j) = min(L(i-1,j)+1, L(i,j-1)+1, L(i-1,j-1)+cost)
 *   O(mn) DP, O(min(m,n)) xotira
 *   Normalized similarity = 1 − L/max(|a|,|b|)
 *   Threshold: sim ≥ 0.7 (sozlanuvchi)
 *
 * TZ-51 BM25 / PostgreSQL FTS:
 *   to_tsvector('simple', text) → tsvector
 *   ts_rank_cd(tsvector, tsquery) → rank (BM25-ga yaqin)
 *   GIN index: pg_trgm va to_tsvector('simple', ...)
 *
 * TAQIQLANGAN: LIKE '%search%' FTS uchun → pg_trgm / to_tsquery ishlatilsin
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeDiv } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { rawSql } from '@shared/db';

const FuzzyRowSchema = z.object({
  id:         z.string(),
  name:       z.string(),
  similarity: z.coerce.number(),
});

const RankRowSchema = z.object({
  id:   z.string(),
  name: z.string(),
  rank: z.coerce.number(),
});

export interface ProductSearchResult {
  id: string;
  name: string;
  similarity: number;
}

export interface FtsResult {
  id: string;
  name: string;
  rank: number;
}

export interface FuzzyMatch<T> {
  item: T;
  similarity: number;
}

@Injectable()
export class FuzzySearchService {
  /**
   * Levenshtein edit distance — O(mn) DP.
   * Xotira optimallashtirish: faqat ikki satr saqlanadi.
   * Sinxron — sof hisoblash.
   */
  levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;

    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    const curr = new Array<number>(n + 1);

    for (let i = 1; i <= m; i++) {
      curr[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = [...curr];
    }

    return prev[n];
  }

  /**
   * Normalized similarity: 1 − levenshtein(a,b) / max(|a|,|b|)
   * 0 = umuman o'xshash emas, 1 = aynan bir xil
   * Sinxron — sof hisoblash.
   */
  similarity(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (!maxLen) return 1;
    return 1 - safeDiv(this.levenshtein(a, b), maxLen);
  }

  /**
   * Ro'yxat ichidan threshold bo'yicha filter qilish (pure, DB siz).
   * Sinxron.
   */
  filterBySimilarity<T>(
    query: string,
    items: readonly T[],
    keyFn: (item: T) => string,
    threshold = 0.7,
  ): Result<FuzzyMatch<T>[], AppError> {
    if (!query.trim()) {
      return Err({ code: 'VALIDATION', message: 'Qidiruv so\'zi bo\'sh bo\'lmasligi kerak' });
    }
    const q = query.toLowerCase();
    const results: FuzzyMatch<T>[] = [];

    for (const item of items) {
      const key = keyFn(item).toLowerCase();
      const sim = this.similarity(q, key);
      if (sim >= threshold) results.push({ item, similarity: sim });
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return Ok(results);
  }

  /**
   * PostgreSQL pg_trgm similarity() yordamida mahsulot qidirish.
   * Indeks: CREATE INDEX CONCURRENTLY ON product USING gin(name gin_trgm_ops)
   * Asinxron — DB so'rovi.
   */
  @Calculation('search.fuzzy.searchProducts')
  async fuzzySearchProducts(
    query: string,
    threshold = 0.7,
    limit = 20,
  ): Promise<Result<ProductSearchResult[], AppError>> {
    if (!query.trim()) {
      return Err({ code: 'VALIDATION', message: 'Qidiruv so\'zi bo\'sh bo\'lmasligi kerak' });
    }
    const lim = Math.min(limit, 100);

    const rawRows = await rawSql(
      sql`
        SELECT p.id, p.name,
               similarity(p.name, ${query}) AS similarity
        FROM product p
        WHERE similarity(p.name, ${query}) >= ${threshold}
        ORDER BY similarity DESC
        LIMIT ${lim}
      `,
    );
    const parseResult = z.array(FuzzyRowSchema).safeParse(rawRows);
    if (!parseResult.success) {
      return Err({ code: 'INTERNAL', message: parseResult.error.message });
    }
    const rows = parseResult.data;

    return Ok(
      (Array.isArray(rows) ? rows : []).map(r => ({
        id: r.id,
        name: r.name,
        similarity: r.similarity,
      })),
    );
  }

  /**
   * PostgreSQL Full-Text Search (BM25 approximation via ts_rank_cd).
   * Indeks: CREATE INDEX CONCURRENTLY ON product USING gin(to_tsvector('simple', ...))
   * language: 'simple' — unicode, diakritikasiz
   * Asinxron — DB so'rovi.
   */
  @Calculation('search.bm25.fullText')
  async fullTextSearch(
    query: string,
    options: {
      tables?: string[];
      lang?: string;
      limit?: number;
    } = {},
  ): Promise<Result<FtsResult[], AppError>> {
    if (!query.trim()) {
      return Err({ code: 'VALIDATION', message: 'Qidiruv so\'zi bo\'sh bo\'lmasligi kerak' });
    }

    const lang  = options.lang ?? 'simple';
    const lim   = Math.min(options.limit ?? 20, 100);
    // plainto_tsquery: apostroflar, tinish belgilari, unicode xavfsiz
    // to_tsquery bilan user input → syntax xato mumkin ('can\'t' → 'can\':*' notog'ri)

    const rawRows = await rawSql(
      sql`
        SELECT p.id, p.name,
               ts_rank_cd(
                 to_tsvector(${lang}, p.name || ' ' || COALESCE(p.description, '')),
                 plainto_tsquery(${lang}, ${query})
               ) AS rank
        FROM product p
        WHERE to_tsvector(${lang}, p.name || ' ' || COALESCE(p.description, ''))
              @@ plainto_tsquery(${lang}, ${query})
        ORDER BY rank DESC
        LIMIT ${lim}
      `,
    );
    const parseResult = z.array(RankRowSchema).safeParse(rawRows);
    if (!parseResult.success) {
      return Err({ code: 'INTERNAL', message: parseResult.error.message });
    }
    const rows = parseResult.data;

    return Ok(
      (Array.isArray(rows) ? rows : []).map(r => ({
        id: r.id,
        name: r.name,
        rank: r.rank,
      })),
    );
  }
}
