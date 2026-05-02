/**
 * cache.service.ts — TZ-59: Redis L1 (in-memory LRU) + L2 (Redis ioredis) kesh.
 *
 * Arxitektura:
 *   L1 — LruCache (lru-cache): <1ms latency, process-local
 *   L2 — Redis (ioredis): ms latency, shared across pods
 *
 * TTL Jitter (stampede oldini olish):
 *   T_actual = T_base × (1 + U(−0.1, 0.1))  → ±10%
 *
 * Cache Key Pattern:
 *   {module}:{entity}:{id}:{version}
 *   europrint:product:uuid:v3
 *
 * TAQIQLANGAN: redis.KEYS() ishlatish → SCAN bilan almashtiring
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { MAX_EXPORT_LIMIT } from '@common/constants/app.constants';

export interface CacheOptions {
  ttlSeconds?: number;
  l1Only?: boolean;
}

/** lru-cache v11 requires V extends {} — wrapper for arbitrary values */
type L1Entry = { v: unknown };

export interface ScanResult {
  cursor: string;
  keys: string[];
}

/**
 * TTL jitter hisoblash: T_base × (1 + U(−0.1, 0.1))
 * Stampede effektini oldini oladi — barcha keshlar bir vaqtda eskirmaslik uchun.
 */
export function applyTtlJitter(baseTtlSeconds: number): number {
  const jitter = (Math.random() * 0.2) - 0.1;
  return Math.max(1, Math.round(baseTtlSeconds * (1 + jitter)));
}

export interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', ttl: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
  scan(cursor: string | number, matchFlag: string, pattern: string, countFlag: string, count: number): Promise<[string, string[]]>;
  status?: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  private readonly l1: LRUCache<string, L1Entry>;

  constructor(
    @Optional() private readonly redis: IRedisClient | null = null,
  ) {
    this.l1 = new LRUCache<string, L1Entry>({
      max: MAX_EXPORT_LIMIT,
      ttl: 60_000,
    });
  }

  /**
   * Keshdan qiymat olish.
   * L1 → L2 → null (cache miss) tartibida tekshiriladi.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const l1Entry = this.l1.get(key);
    if (l1Entry !== undefined) {
      return l1Entry.v as T;
    }

    if (this.redis) {
      try {
        const raw = await this.redis.get(key);
        if (raw !== null) {
          const parsed = JSON.parse(raw) as T;
          this.l1.set(key, { v: parsed });
          return parsed;
        }
      } catch (err) {
        this.logger.warn(`Cache L2 get xato (${key}): ${String(err)}`);
      }
    }

    return null; // cache miss
  }

  /**
   * Keshga qiymat yozish.
   * L1 + L2 ikkalasiga ham yoziladi.
   * TTL jitter qo'llaniladi.
   */
  async set(key: string, value: unknown, options: CacheOptions = {}): Promise<void> {
    const baseTtl = options.ttlSeconds ?? 300;
    const actualTtl = applyTtlJitter(baseTtl);

    this.l1.set(key, { v: value }, { ttl: actualTtl * 1_000 });

    if (!options.l1Only && this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), 'EX', actualTtl);
      } catch (err) {
        this.logger.warn(`Cache L2 set xato (${key}): ${String(err)}`);
      }
    }
  }

  /**
   * Keshdan o'chirish — L1 + L2.
   */
  async delete(key: string): Promise<void> {
    this.l1.delete(key);
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (err) {
        this.logger.warn(`Cache L2 delete xato (${key}): ${String(err)}`);
      }
    }
  }

  /**
   * Pattern bo'yicha kalitlarni qidirish — SCAN bilan (KEYS() TAQIQLANGAN).
   * cursor='0' bilan boshlash, '0' qaytguncha takrorlang.
   */
  async scan(pattern: string, cursorStart = '0', count = 100): Promise<ScanResult> {
    if (!this.redis) {
      return { cursor: '0', keys: [] };
    }

    try {
      const [nextCursor, keys] = await this.redis.scan(
        cursorStart, 'MATCH', pattern, 'COUNT', count,
      );
      return { cursor: nextCursor, keys };
    } catch (err) {
      this.logger.warn(`Cache SCAN xato (${pattern}): ${String(err)}`);
      return { cursor: '0', keys: [] };
    }
  }

  /**
   * L1 keshni tozalash (test uchun).
   */
  clearL1(): void {
    this.l1.clear();
  }

  get isRedisConnected(): boolean {
    return this.redis?.status === 'ready';
  }
}
