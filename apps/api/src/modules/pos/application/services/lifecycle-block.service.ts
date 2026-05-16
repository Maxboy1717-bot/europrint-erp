/**
 * @module lifecycle-block.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { MS_PER_DAY, SECONDS_PER_DAY, MS_PER_SECOND, POLL_INTERVAL_MS } from '@common/constants/app.constants';
/**
 * POS — Lifecycle Block Service
 *
 * §38 ARCHITECTURE: Material hayot davri bloklash
 *
 * Muammo: Xodimga bir xil materialdan juda tez-tez berilishi (erta chiqim).
 * Yechim: materialCards.min_interval_days — oxirgi berilgandan beri kamida
 *   X kun o'tishi shart. Redis + DB ikki qatlamli tekshiruv.
 *
 * Kalit: `lifecycle:{userId}:{materialCardId}` — TTL = min_interval_days * SECONDS_PER_DAY
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { safeCall, Ok, Result, AppError } from '@common/result';
import { PosLifecycleBlockRepository } from '../../infrastructure/repositories/pos-lifecycle-block.repository';
import { safeJsonParse } from '@shared/utils/safe-json';

interface BlockCheckResult {
  allowed: boolean;
  reason?: string;
  nextAllowedAt?: Date;
}

type RedisLike = {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<unknown>;
  quit(): Promise<unknown>;
  connect?(): Promise<void>;
};

const LIFECYCLE_KEY = (userId: number, materialCardId: number) =>
  `lifecycle:${userId}:${materialCardId}`;

@Injectable()
export class LifecycleBlockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LifecycleBlockService.name);
  private redisClient: RedisLike | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly lifecycleRepo: PosLifecycleBlockRepository,
  ) {}

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[lifecycle-block.service] init failed: ' + e)); }
  private async _initBackground(): Promise<void> {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) return;
    const r = await safeCall(async () => {
      const { default: Redis } = await import('ioredis');
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 2,
        connectTimeout: POLL_INTERVAL_MS,
        lazyConnect: true,
      }) as RedisLike;
      await (this.redisClient)?.connect?.();
    });
    if (!r.ok) this.redisClient = null;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) await this.redisClient.quit().catch((e: unknown) => { this.logger.warn('Redis quit error', String(e)); });
  }

  /**
   * Lifecycle bloklash tekshiruvi.
   * @returns { allowed, reason, nextAllowedAt }
   */
  async check(
    userId: number,
    materialCardId: number,
    requestedQty: number,
  ): Promise<BlockCheckResult> {
    // 1. Redis — tez tekshiruv
    if (this.redisClient) {
      const cached = await this.redisClient.get(LIFECYCLE_KEY(userId, materialCardId));
      if (cached) {
        const parsed = safeJsonParse<{ nextAllowedAt: string; reason: string } | null>(cached, null);
        const { nextAllowedAt, reason } = parsed ?? { nextAllowedAt: new Date(Date.now() + 60_000).toISOString(), reason: 'Qulflangan' };
        return {
          allowed: false,
          reason,
          nextAllowedAt: new Date(nextAllowedAt),
        };
      }
    }

    // 2. DB tekshiruv
    const ruleResult = await this.lifecycleRepo.getLifecycleRule(userId, materialCardId);
    const ruleData = (ruleResult.ok ? ruleResult.data : null) as Record<string, unknown> | null;
    const minIntervalDays = Number(ruleData?.['min_interval_days'] ?? 0);
    const maxQtyPerIssue  = Number(ruleData?.['max_qty_per_issue'] ?? 0);
    const lastIssuedAt    = ruleData?.['last_issued_at'] ? new Date(String(ruleData['last_issued_at'])) : null;

    // max_qty_per_issue tekshiruv
    if (maxQtyPerIssue > 0 && requestedQty > maxQtyPerIssue) {
      return {
        allowed: false,
        reason: `Bir martalik maksimal miqdor: ${maxQtyPerIssue} (so'ralgan: ${requestedQty})`,
      };
    }

    // min_interval_days tekshiruv
    if (minIntervalDays > 0 && lastIssuedAt) {
      const diffMs   = Date.now() - lastIssuedAt.getTime();
      const diffDays = diffMs / MS_PER_DAY;

      if (diffDays < minIntervalDays) {
        const nextAllowedAt = new Date(
          lastIssuedAt.getTime() + minIntervalDays * MS_PER_DAY,
        );
        const reason = `Keyingi berilish sanasi: ${nextAllowedAt.toLocaleDateString('uz-UZ')} (min interval: ${minIntervalDays} kun)`;

        // Redis ga saqlash
        if (this.redisClient) {
          const ttl = Math.max(1, Math.ceil((nextAllowedAt.getTime() - Date.now()) / MS_PER_SECOND));
          await this.redisClient.setex(
            LIFECYCLE_KEY(userId, materialCardId),
            ttl,
            JSON.stringify({ nextAllowedAt, reason }),
          );
        }

        return { allowed: false, reason, nextAllowedAt };
      }
    }

    return { allowed: true };
  }

  /**
   * Material berilgandan keyin lifecycle yozuvini saqlash.
   */
  async recordIssuance(
    userId: number,
    materialCardId: number,
    minIntervalDays: number,
  ): Promise<void> {
    await this.lifecycleRepo.recordIssuance(userId, materialCardId);

    // Redis cache tozalash (eski blok o'chadi, yangi issuance boshlanadi)
    if (this.redisClient && minIntervalDays > 0) {
      const nextAllowedAt = new Date(Date.now() + minIntervalDays * MS_PER_DAY);
      const ttl = minIntervalDays * 24 * 60 * 60;
      await this.redisClient.setex(
        LIFECYCLE_KEY(userId, materialCardId),
        ttl,
        JSON.stringify({
          nextAllowedAt,
          reason: `Keyingi berilish: ${nextAllowedAt.toLocaleDateString('uz-UZ')}`,
        }),
      ).catch((e: unknown) => { this.logger.warn('Lifecycle yozuv xato', String(e)); });
    }

    this.logger.debug(`Lifecycle yozuv: userId=${userId} materialCardId=${materialCardId}`);
  }
}
