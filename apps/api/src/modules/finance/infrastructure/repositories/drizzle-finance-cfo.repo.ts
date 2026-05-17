/**
 * @module drizzle-finance-cfo.repo
 * @description CFO configuration sub-repo (P0-1). Extracted from drizzle-finance.repo
 *              as part of Rule 13/16 split.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db, cfoConfigTable } from '@shared/db';
import { asc, eq, inArray } from 'drizzle-orm';
import { Result } from '@common/types/result.type';
import { CfoConfigRow } from '../../domain/repositories/i-finance.repo';

@Injectable()
export class FinanceCfoRepo {
  private readonly logger = new Logger(FinanceCfoRepo.name);

  async findCfoConfig(key: string): Promise<Result<CfoConfigRow | null>> {
    try {
      const rows = await db.select({
        id: cfoConfigTable.id,
        config_key: cfoConfigTable.configKey,
        config_value: cfoConfigTable.configValue,
        description: cfoConfigTable.description,
        updated_at: cfoConfigTable.updatedAt,
      }).from(cfoConfigTable).where(eq(cfoConfigTable.configKey, key)).limit(1);
      const row = rows[0];
      if (!row) return { ok: true, data: null };
      return {
        ok: true,
        data: {
          id:          Number(row.id ?? 0),
          configKey:   String(row.config_key ?? ''),
          configValue: String(row.config_value ?? '0'),
          description: row.description ? String(row.description) : null,
          updatedAt:   row.updated_at ? new Date(String(row.updated_at)) : new Date(),
        },
      };
    } catch (error: unknown) {
      this.logger.error(`findCfoConfig("${key}") xato: ${(error as Error).message}`);
      return { ok: false, error: { code: 'DB_ERROR', message: (error as Error).message } };
    }
  }

  async findCfoConfigMap(keys: string[]): Promise<Result<Map<string, string>>> {
    try {
      if (!Array.isArray(keys) || keys.length === 0) {
        return { ok: true, data: new Map<string, string>() };
      }
      const rows = await db.select({
        config_key: cfoConfigTable.configKey,
        config_value: cfoConfigTable.configValue,
      }).from(cfoConfigTable).where(inArray(cfoConfigTable.configKey, keys));
      const map = new Map<string, string>();
      for (const row of rows) {
        map.set(String(row.config_key ?? ''), String(row.config_value ?? '0'));
      }
      return { ok: true, data: map };
    } catch (error: unknown) {
      this.logger.error(`findCfoConfigMap xato: ${(error as Error).message}`);
      return { ok: false, error: { code: 'DB_ERROR', message: (error as Error).message } };
    }
  }

  async findAllCfoConfig(): Promise<Result<CfoConfigRow[]>> {
    try {
      const rows = await db.select({
        id: cfoConfigTable.id,
        config_key: cfoConfigTable.configKey,
        config_value: cfoConfigTable.configValue,
        description: cfoConfigTable.description,
        updated_at: cfoConfigTable.updatedAt,
      }).from(cfoConfigTable).orderBy(asc(cfoConfigTable.configKey));
      const data: CfoConfigRow[] = rows.map(row => ({
        id:          Number(row.id ?? 0),
        configKey:   String(row.config_key ?? ''),
        configValue: String(row.config_value ?? '0'),
        description: row.description ? String(row.description) : null,
        updatedAt:   row.updated_at ? new Date(String(row.updated_at)) : new Date(),
      }));
      return { ok: true, data };
    } catch (error: unknown) {
      this.logger.error(`findAllCfoConfig xato: ${(error as Error).message}`);
      return { ok: false, error: { code: 'DB_ERROR', message: (error as Error).message } };
    }
  }

  async upsertCfoConfig(input: { key: string; value: number }): Promise<Result<CfoConfigRow>> {
    try {
      const rows = await db.insert(cfoConfigTable)
        .values({ configKey: input.key, configValue: String(input.value), updatedAt: new Date() })
        .onConflictDoUpdate({
          target: cfoConfigTable.configKey,
          set: { configValue: String(input.value), updatedAt: new Date() },
        })
        .returning({
          id: cfoConfigTable.id,
          config_key: cfoConfigTable.configKey,
          config_value: cfoConfigTable.configValue,
          description: cfoConfigTable.description,
          updated_at: cfoConfigTable.updatedAt,
        });
      const row = rows[0];
      if (!row) return { ok: false, error: { code: 'DB_ERROR', message: `CFO config key topilmadi: ${input.key}` } };
      return {
        ok: true,
        data: {
          id:          Number(row.id ?? 0),
          configKey:   String(row.config_key ?? ''),
          configValue: String(row.config_value ?? '0'),
          description: row.description ? String(row.description) : null,
          updatedAt:   row.updated_at ? new Date(String(row.updated_at)) : new Date(),
        },
      };
    } catch (error: unknown) {
      this.logger.error(`upsertCfoConfig("${input.key}") xato: ${(error as Error).message}`);
      return { ok: false, error: { code: 'DB_ERROR', message: (error as Error).message } };
    }
  }
}
