/**
 * @module cfo-config.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Domain-layer service — MUST NOT import Drizzle / @shared/db. All persistence
 * is delegated to IFinanceRepo (see P0-1 DDD audit).
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import Decimal from 'decimal.js';
import { Ok, Err, Result, AppError } from '@common/result';
import { Calculation } from '@common/decorators/calculation.decorator';
import { FINANCE_REPO, IFinanceRepo, CfoConfigRow } from '../repositories/i-finance.repo';

// Re-exported for consumers that previously imported the type from this file.
export type { CfoConfigRow } from '../repositories/i-finance.repo';

@Injectable()
export class CfoConfigService {
  private readonly logger = new Logger(CfoConfigService.name);

  constructor(@Inject(FINANCE_REPO) private readonly repo: IFinanceRepo) {}

  /** Returns the config value as a Decimal (preserves numeric precision). */
  @Calculation('cfo-config-read')
  async get(key: string): Promise<Result<Decimal, AppError>> {
    try {
      const res = await this.repo.findCfoConfig(key);
      if (!res.ok) {
        this.logger.error(`CfoConfigService.get("${key}") xato: ${res.error.message}`);
        return Err('Ichki server xatosi');
      }
      if (!res.data) return Err(`CFO config key topilmadi: ${key}`);
      return Ok(new Decimal(res.data.configValue ?? '0'));
    } catch (err) {
      this.logger.error(`CfoConfigService.get("${key}") xato: ${String(err)}`);
      return Err('Ichki server xatosi');
    }
  }

  /** Returns a map of key → Decimal values; returns Result to surface DB errors. */
  async getMap(keys: string[]): Promise<Result<Map<string, Decimal>, AppError>> {
    try {
      const res = await this.repo.findCfoConfigMap(keys);
      if (!res.ok) {
        this.logger.error(`CfoConfigService.getMap xato: ${res.error.message}`);
        return Err('Ichki server xatosi');
      }
      const map = new Map<string, Decimal>();
      for (const [k, v] of res.data.entries()) {
        map.set(k, new Decimal(v ?? '0'));
      }
      return Ok(map);
    } catch (err) {
      this.logger.error(`CfoConfigService.getMap xato: ${String(err)}`);
      return Err('Ichki server xatosi');
    }
  }

  /** Convenience: returns number value or fallback (never throws). */
  async getNumber(key: string, fallback: number): Promise<number> {
    const res = await this.get(key);
    return res.ok ? res.data.toNumber() : fallback;
  }

  /** Returns all config entries. */
  @Calculation('cfo-config-list')
  async findAll(): Promise<Result<CfoConfigRow[], AppError>> {
    try {
      const res = await this.repo.findAllCfoConfig();
      if (!res.ok) {
        this.logger.error(`CfoConfigService.findAll xato: ${res.error.message}`);
        return Err('Ichki server xatosi');
      }
      return Ok(res.data);
    } catch (err) {
      this.logger.error(`CfoConfigService.findAll xato: ${String(err)}`);
      return Err('Ichki server xatosi');
    }
  }

  /** Updates (upserts) a config value by key. */
  @Calculation('cfo-config-update')
  async update(key: string, value: number): Promise<Result<CfoConfigRow, AppError>> {
    try {
      const res = await this.repo.upsertCfoConfig({ key, value });
      if (!res.ok) {
        this.logger.error(`CfoConfigService.update("${key}") xato: ${res.error.message}`);
        return Err('Ichki server xatosi');
      }
      return Ok(res.data);
    } catch (err) {
      this.logger.error(`CfoConfigService.update("${key}") xato: ${String(err)}`);
      return Err('Ichki server xatosi');
    }
  }
}
