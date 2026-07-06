/**
 * @module currency-rates.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 *
 * F6 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): this cron used to fabricate a daily
 * `✅ processed=5` success log without ever fetching or writing anything — the "dominant risk"
 * flagged in the finance audit (silent staleness behind a fake-success cron). It now performs a
 * REAL fetch against the Central Bank of Uzbekistan's public JSON feed (no auth required;
 * verified live: `https://cbu.uz/uz/arkhiv-kursov-valyut/json/` returns HTTP 200 with per-currency
 * `{Ccy, Nominal, Rate, Date}` rows) and inserts real rates into `exchange_rates`. A fetch/parse
 * failure is logged honestly (CronStatusService.recordFailure) — never reported as success.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { CronStatusService } from './cron-status.service';

const CBU_FEED_URL = 'https://cbu.uz/uz/arkhiv-kursov-valyut/json/';
const TRACKED_CURRENCIES = ['USD', 'EUR', 'RUB', 'CNY'] as const;
const BASE_CURRENCY = 'UZS';
const FETCH_TIMEOUT_MS = 10_000;

interface CbuRate {
  Ccy: string;
  Nominal: string;
  Rate: string;
  Date: string; // DD.MM.YYYY
}

function cbuDateToIso(cbuDate: string): string | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(cbuDate);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

@Injectable()
export class CurrencyRatesCron {
  private readonly logger = new Logger(CurrencyRatesCron.name);

  constructor(private readonly cronStatus: CronStatusService) {}

  @Cron('0 9 * * *')
  async run(): Promise<void> {
    const jobName = 'CurrencyRatesCron';
    try {
      const rows = await this.fetchCbuRates();

      let inserted = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const code of TRACKED_CURRENCIES) {
        const row = rows.find((r) => r.Ccy === code);
        if (!row) {
          errors.push(`${code}: CBU javobida topilmadi`);
          continue;
        }
        const isoDate = cbuDateToIso(row.Date);
        const nominal = Number(row.Nominal);
        const rawRate = Number(row.Rate);
        if (!isoDate || !Number.isFinite(nominal) || nominal <= 0 || !Number.isFinite(rawRate) || rawRate <= 0) {
          errors.push(`${code}: yaroqsiz javob (Nominal=${row.Nominal}, Rate=${row.Rate}, Date=${row.Date})`);
          continue;
        }
        const rate = rawRate / nominal;

        // F6 sub-fix 2: keep `currencies.exchange_rate` in sync with `exchange_rates` every run —
        // these were two disconnected sources of truth (currencies had a frozen 2026-05-21 seed
        // value, exchange_rates had the real rate) that silently diverged by 1.5-14%. Updated
        // regardless of whether today's exchange_rates row is new or already-current, so a
        // currencies row can never again drift stale behind exchange_rates.
        await runQuery(sql`
          UPDATE currencies SET exchange_rate = ${rate}, updated_at = NOW() WHERE code = ${code}
        `);

        // Idempotent: one row per (from_currency, to_currency, rate_date) — a re-run the same
        // day (manual trigger, cron retry) does not duplicate the day's rate.
        const existing = await runQuery<{ id: number }>(sql`
          SELECT id FROM exchange_rates
          WHERE from_currency = ${code} AND to_currency = ${BASE_CURRENCY} AND rate_date = ${isoDate}
          LIMIT 1
        `);
        if (existing.rows[0]) {
          skipped++;
          continue;
        }

        await runQuery(sql`
          INSERT INTO exchange_rates (from_currency, to_currency, rate, rate_date, source, created_at)
          VALUES (${code}, ${BASE_CURRENCY}, ${rate}, ${isoDate}, 'CBU-API', NOW())
        `);
        inserted++;
      }

      if (errors.length > 0) {
        this.logger.warn(`CurrencyRatesCron: qisman muvaffaqiyat — inserted=${inserted}, skipped=${skipped}, xatolar=${errors.join('; ')}`);
      } else {
        this.logger.log(`CurrencyRatesCron: ✅ inserted=${inserted}, skipped(already today)=${skipped}`);
      }

      if (inserted === 0 && skipped === 0) {
        // Nothing written and nothing already-current — this is a real failure, not success.
        this.cronStatus.recordFailure(jobName, errors.join('; ') || 'hech qanday kurs yozilmadi');
      } else {
        this.cronStatus.recordSuccess(jobName);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`❌ CurrencyRatesCron: CBU fetch/yozish muvaffaqiyatsiz — ${message}`);
      this.cronStatus.recordFailure(jobName, message);
    }
  }

  private async fetchCbuRates(): Promise<CbuRate[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(CBU_FEED_URL, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`CBU API HTTP ${res.status}`);
      }
      const data = (await res.json()) as unknown;
      if (!Array.isArray(data)) {
        throw new Error('CBU API javobi array emas');
      }
      return data as CbuRate[];
    } finally {
      clearTimeout(timeout);
    }
  }
}
