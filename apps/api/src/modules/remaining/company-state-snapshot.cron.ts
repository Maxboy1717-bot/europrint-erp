/**
 * @module company-state-snapshot.cron
 * @description T18-C4 director: daily company-state snapshot writer.
 *
 * Vision (EP-DIR-001 / EP-DIR-029): the 5-metric weighted holat is computed live
 * by CompanyStateService.getCurrent(); this cron persists a daily snapshot into
 * `company_state_log` (state_code + kpis JSONB + score_total + detected_at) so the
 * director dashboard + P30 diary auto-fill can read the historical trend.
 *
 * - Runs every day 06:00 Asia/Tashkent (after overnight data settles).
 * - Idempotent per day: skips if a row already exists for today (no duplicate
 *   snapshots if the process restarts / cron double-fires).
 * - Result<T> (Qoida 1); never throws out of the scheduled handler.
 * - Public `snapshotNow()` lets an endpoint/test trigger a snapshot on demand
 *   (JONLI rollback-tx proof) without waiting for the cron tick.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result, AppError } from '@common/result';
import { CompanyStateService } from './company-state.service';

interface CurrentState {
  state?: string;
  level?: string;
  score?: number;
  kpis?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

@Injectable()
export class CompanyStateSnapshotCron {
  private readonly logger = new Logger(CompanyStateSnapshotCron.name);

  constructor(private readonly companyState: CompanyStateService) {}

  // Har kuni 07:00 (Asia/Tashkent) — kunlik holat snapshot (vizyon 05.3/#18: 07:00).
  @Cron('0 7 * * *', { timeZone: 'Asia/Tashkent' })
  async dailySnapshot(): Promise<Result<{ written: boolean; stateCode: string }, AppError>> {
    this.logger.log('[CompanyStateSnapshot] kunlik holat snapshot boshlandi');
    return this.snapshotNow();
  }

  /**
   * Compute the current holat and write one row into company_state_log for today
   * (idempotent per calendar day). Returns whether a row was written.
   */
  async snapshotNow(): Promise<Result<{ written: boolean; stateCode: string }, AppError>> {
    return safeCall(async () => {
      const currentR = await this.companyState.getCurrent();
      if (!currentR.ok) {
        this.logger.warn(`[CompanyStateSnapshot] getCurrent failed: ${currentR.error.message}`);
        // graceful: nothing to snapshot if state could not be computed
        return { written: false, stateCode: 'UNKNOWN' };
      }
      const cur = currentR.data as CurrentState;
      // CompanyStateService returns `level` as the UPPERCASE band (OSISH/NORMAL/...).
      const stateCode = String(cur.level ?? cur.state ?? 'NORMAL').toUpperCase();
      const scoreTotal = Number(cur.score ?? 0);
      const kpis = cur.kpis ?? cur.metrics ?? {};

      // Idempotent per day: only one snapshot per calendar date.
      const existing = await runQuery<{ id: number }>(sql`
        SELECT id FROM company_state_log
        WHERE detected_at >= date_trunc('day', NOW())
          AND detected_at <  date_trunc('day', NOW()) + INTERVAL '1 day'
        LIMIT 1
      `);
      if (Array.isArray(existing.rows) && existing.rows.length > 0) {
        this.logger.log('[CompanyStateSnapshot] bugun uchun snapshot allaqachon mavjud — o\'tkazib yuborildi');
        return { written: false, stateCode };
      }

      await runQuery(sql`
        INSERT INTO company_state_log (state_code, kpis, score_total, detected_at)
        VALUES (${stateCode}, ${JSON.stringify(kpis)}::jsonb, ${scoreTotal}, NOW())
      `);
      this.logger.log(`[CompanyStateSnapshot] yozildi: state=${stateCode} score=${scoreTotal}`);

      // EP-DIR-005 (vizyon 05.3): bugungi snapshot yozilgach, ketma-ket kunlik
      // "og'ish tezligi" tekshiruvi — 3 kun ketma-ket tushishda alert event
      // chiqadi. Best-effort: detektor xatosi snapshot natijasini buzmaydi.
      const declineR = await this.companyState.detectConsecutiveDecline();
      if (declineR.ok && declineR.data.alert) {
        this.logger.warn(
          `[CompanyStateSnapshot] EP-DIR-005 og'ish alert: ${declineR.data.consecutiveDeclineDays} kun ketma-ket tushish (emitted=${declineR.data.emitted})`,
        );
      }

      return { written: true, stateCode };
    }, 'DB_ERROR');
  }
}
