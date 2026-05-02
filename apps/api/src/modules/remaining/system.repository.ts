import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { execSystemHealthCheck } from '@common/database/queries-remaining';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class SystemRepository {
  async ping(): Promise<Result<number>> {
    return safeCall(async () => {
      const t0 = Date.now();
      await execSystemHealthCheck();
      return Date.now() - t0;
      }, 'DB_ERROR');
  }

  async getDbStats(): Promise<Result<{ userCount: number; dbSize: string; tables: Row[] }>> {
    return safeCall(async () => {
      const [userCountR, tableStatsR, dbSizeR] = await Promise.all([
        exec(sql`SELECT COUNT(*) AS count FROM users`),
        exec(sql`SELECT relname AS table_name, n_tup_ins AS inserts, n_tup_upd AS updates, n_tup_del AS deletes, n_live_tup AS live_rows FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20`),
        exec(sql`SELECT pg_size_pretty(pg_database_size(current_database())) AS size`),
      ]);
      return {
        userCount: Number(userCountR[0]?.count ?? 0),
        dbSize: String(dbSizeR[0]?.size ?? 'N/A'),
        tables: tableStatsR as Row[],
      };
      }, 'DB_ERROR');
  }

  async getSettings(): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT * FROM settings LIMIT 1`);
      return r[0] ?? null;
      }, 'DB_ERROR');
  }

  async getSettingsId(): Promise<Result<unknown | null>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT id FROM settings LIMIT 1`);
      return r[0]?.id ?? null;
      }, 'DB_ERROR');
  }

  async updateSettings(id: unknown, body: Row): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await exec(sql`UPDATE settings SET company_name = COALESCE(${body['companyName'] ?? null}::text, company_name), company_name_ru = COALESCE(${body['companyNameRu'] ?? null}::text, company_name_ru), default_currency = COALESCE(${body['defaultCurrency'] ?? null}::text, default_currency), timezone = COALESCE(${body['timezone'] ?? null}::text, timezone), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r[0];
      }, 'DB_ERROR');
  }

  async createSettings(body: Row): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await exec(sql`INSERT INTO settings (company_name, default_currency, timezone, created_at, updated_at) VALUES (${body['companyName'] ?? 'EuroPrint'}, ${body['defaultCurrency'] ?? 'UZS'}, ${body['timezone'] ?? 'Asia/Tashkent'}, NOW(), NOW()) RETURNING *`);
      return r[0];
      }, 'DB_ERROR');
  }
}
