/**
 * @module ckp-fact.repository
 * @description ЦКП kunlik FAKT-qiymat data-access (ckp_fact_values). FAZA-05 (EP-ORG-014..018).
 *   Result<T>, parametrlangan sql. Kunlik idempotent upsert (card+date+employee+product).
 *   Kaskad-agregat: karta + farzandlar (bo'lim/otdeleniye) o'rtacha achievement.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, safeCall } from '@common/result';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export interface CkpFactInput {
  cardId: number;
  employeeId?: number | null;
  productId?: number | null;
  factDate: string;
  targetValue?: number | null;
  actualValue?: number | null;
  achievementPct: number;
  source: string;
  formulaType?: string | null;
  notes?: string | null;
  recordedBy?: number | null;
}

@Injectable()
export class CkpFactRepository {
  private exec(q: SQL | SQLWrapper): Promise<Result<Row[]>> {
    return safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
  }

  /** Karta ЦКП-meta (formula-turi/norma/o'lchov) — fakt baholash uchun. */
  async cardCkpMeta(cardId: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      SELECT id, name, tskp, tskp_target, tskp_measurement_unit, ckp_formula_type, ckp_frequency, ckp_report_deadline_hours
      FROM org_departments WHERE id = ${cardId} LIMIT 1
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /** Kunlik fakt upsert (idempotent: card+date+employee+product). */
  async upsertFact(i: CkpFactInput): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO ckp_fact_values
          (card_id, employee_id, product_id, fact_date, target_value, actual_value, achievement_pct, source, formula_type, status, submitted_at, notes, recorded_by, created_at)
        VALUES
          (${i.cardId}, ${i.employeeId ?? null}, ${i.productId ?? null}, ${i.factDate}, ${i.targetValue ?? null}, ${i.actualValue ?? null}, ${i.achievementPct}, ${i.source}, ${i.formulaType ?? null}, 'submitted', NOW(), ${i.notes ?? null}, ${i.recordedBy ?? null}, NOW())
        ON CONFLICT (card_id, fact_date, COALESCE(employee_id,0), COALESCE(product_id,0))
        DO UPDATE SET actual_value = EXCLUDED.actual_value, target_value = EXCLUDED.target_value,
          achievement_pct = EXCLUDED.achievement_pct, source = EXCLUDED.source, status = 'submitted',
          submitted_at = NOW(), notes = EXCLUDED.notes, recorded_by = EXCLUDED.recorded_by
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }

  async listByCard(cardId: number, from: string | null, to: string | null): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT * FROM ckp_fact_values
      WHERE card_id = ${cardId}
        AND (${from}::date IS NULL OR fact_date >= ${from}::date)
        AND (${to}::date IS NULL OR fact_date <= ${to}::date)
      ORDER BY fact_date DESC, id DESC
    `);
  }

  /** Kaskad-agregat: karta + uning farzandlari o'rtacha achievement (bir kun). */
  async aggregateByDate(cardId: number, date: string): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      WITH RECURSIVE subtree AS (
        SELECT id FROM org_departments WHERE id = ${cardId}
        UNION ALL
        SELECT d.id FROM org_departments d JOIN subtree s ON d.parent_id = s.id
      )
      SELECT COUNT(f.id)::int AS fact_count, ROUND(AVG(f.achievement_pct), 2) AS avg_achievement
      FROM ckp_fact_values f WHERE f.card_id IN (SELECT id FROM subtree) AND f.fact_date = ${date}::date
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /**
   * Kunlik kaskad-agregat — HAR root-karta (parent_id NULL) uchun subtree o'rtacha achievement,
   * bitta so'rovda (N+1 yo'q — Performance qoidasi). Kunlik cron shu metodni chaqiradi.
   * Faqat o'sha kuni fakti bor root'lar qaytariladi (HAVING fact_count>0 — FABRIKATSIYA YO'Q:
   * fakt yo'q root soxta 0% bermaydi). Har qator: card_id (root), fact_count, avg_achievement.
   */
  async aggregateAllRoots(date: string): Promise<Result<Row[]>> {
    return this.exec(sql`
      WITH RECURSIVE tree AS (
        SELECT id AS root_id, id FROM org_departments WHERE parent_id IS NULL
        UNION ALL
        SELECT t.root_id, d.id FROM org_departments d JOIN tree t ON d.parent_id = t.id
      )
      SELECT t.root_id AS card_id,
             COUNT(f.id)::int AS fact_count,
             ROUND(AVG(f.achievement_pct), 2) AS avg_achievement
      FROM tree t
      LEFT JOIN ckp_fact_values f ON f.card_id = t.id AND f.fact_date = ${date}::date
      GROUP BY t.root_id
      HAVING COUNT(f.id) > 0
      ORDER BY t.root_id
    `);
  }
}
