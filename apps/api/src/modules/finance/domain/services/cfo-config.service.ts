/**
 * @module cfo-config.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { pgTable, serial, varchar, numeric, text, timestamp } from 'drizzle-orm/pg-core';
import { eq, inArray } from 'drizzle-orm';
import Decimal from 'decimal.js';
import { Ok, Err, Result, AppError } from '@common/result';
import { Calculation } from '@common/decorators/calculation.decorator';

export const cfoConfig = pgTable('cfo_config', {
  id:          serial('id').primaryKey(),
  configKey:   varchar('config_key', { length: 100 }).notNull().unique(),
  configValue: numeric('config_value', { precision: 20, scale: 6 }).notNull(),
  description: text('description'),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
});

export interface CfoConfigRow {
  id: number;
  configKey: string;
  configValue: string;
  description: string | null;
  updatedAt: Date;
}

@Injectable()
export class CfoConfigService {
  private readonly logger = new Logger(CfoConfigService.name);

  /** Returns the config value as a Decimal (preserves numeric precision). */
  @Calculation('cfo-config-read')
  async get(key: string): Promise<Result<Decimal, AppError>> {
    try {
      const rows = await db
        .select({ configValue: cfoConfig.configValue })
        .from(cfoConfig)
        .where(eq(cfoConfig.configKey, key))
        .limit(1);
      if (rows.length === 0) {
        return Err(`CFO config key topilmadi: ${key}`);
      }
      return Ok(new Decimal(rows[0]?.configValue ?? '0'));
    } catch (err) {
      this.logger.error(`CfoConfigService.get("${key}") xato: ${String(err)}`);
      return Err('Ichki server xatosi');
    }
  }

  /** Returns a map of key → Decimal values; returns Result to surface DB errors. */
  async getMap(keys: string[]): Promise<Result<Map<string, Decimal>, AppError>> {
    try {
      const rows = await db
        .select({ configKey: cfoConfig.configKey, configValue: cfoConfig.configValue })
        .from(cfoConfig)
        .where(inArray(cfoConfig.configKey, keys));
      const map = new Map<string, Decimal>();
      for (const row of rows) {
        map.set(row.configKey, new Decimal(row.configValue ?? '0'));
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
      const rows = await db
        .select()
        .from(cfoConfig)
        .orderBy(cfoConfig.configKey);
      return Ok(rows as CfoConfigRow[]);
    } catch (err) {
      this.logger.error(`CfoConfigService.findAll xato: ${String(err)}`);
      return Err('Ichki server xatosi');
    }
  }

  /** Updates a config value by key. */
  @Calculation('cfo-config-update')
  async update(key: string, value: number): Promise<Result<CfoConfigRow, AppError>> {
    try {
      const updated = await db
        .update(cfoConfig)
        .set({ configValue: String(value), updatedAt: new Date() })
        .where(eq(cfoConfig.configKey, key))
        .returning();
      if (updated.length === 0) {
        return Err(`CFO config key topilmadi: ${key}`);
      }
      return Ok(updated[0] as CfoConfigRow);
    } catch (err) {
      this.logger.error(`CfoConfigService.update("${key}") xato: ${String(err)}`);
      return Err('Ichki server xatosi');
    }
  }
}
