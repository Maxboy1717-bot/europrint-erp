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
import { CKP_ROLLUP_SOURCE } from './cascade/ckp-cascade.constants';

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
  /** Nuqson/xato sababi — error_catalog.code'ga soft-link (NULL = sabab ko'rsatilmagan). */
  errorCode?: string | null;
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
      SELECT id, name, tskp, tskp_target, tskp_measurement_unit,
             tskp_formula_type, ckp_formula_type, ckp_frequency, ckp_report_deadline_hours
      FROM org_departments WHERE id = ${cardId} LIMIT 1
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /**
   * GAP #10 — multi-product slot lookup. Karta+mahsulot bo'yicha norma+formula
   * (ckp_card_products). Topilmasa null (karta-global fallback service'da). is_active=true.
   */
  async cardProductTarget(cardId: number, productId: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      SELECT target_value, formula_type, measurement_unit
      FROM ckp_card_products
      WHERE card_id = ${cardId} AND product_id = ${productId} AND is_active = true
      LIMIT 1
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /**
   * GAP #14 — per-employee norma override (ckp_personal_targets). Aniq xodim+karta
   * uchun (ixtiyoriy product+period) shaxsiy norma. Eng aniq mosni qaytaradi:
   * product+period mos kelganlar ustun (NULL=joker, lekin aniqligi past).
   * Topilmasa null (karta-global/product fallback service'da).
   */
  async personalTarget(
    cardId: number,
    employeeId: number,
    productId: number | null,
    period: string | null,
  ): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      SELECT target_value, formula_type
      FROM ckp_personal_targets
      WHERE card_id = ${cardId} AND employee_id = ${employeeId}
        AND (product_id IS NULL OR product_id = ${productId})
        AND (period IS NULL OR period = ${period})
      ORDER BY (product_id IS NOT NULL)::int DESC, (period IS NOT NULL)::int DESC, id DESC
      LIMIT 1
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /** Kunlik fakt upsert (idempotent: card+date+employee+product). */
  async upsertFact(i: CkpFactInput): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO ckp_fact_values
          (card_id, employee_id, product_id, fact_date, target_value, actual_value, achievement_pct, source, formula_type, error_code, status, submitted_at, notes, recorded_by, created_at)
        VALUES
          (${i.cardId}, ${i.employeeId ?? null}, ${i.productId ?? null}, ${i.factDate}, ${i.targetValue ?? null}, ${i.actualValue ?? null}, ${i.achievementPct}, ${i.source}, ${i.formulaType ?? null}, ${i.errorCode ?? null}, 'submitted', NOW(), ${i.notes ?? null}, ${i.recordedBy ?? null}, NOW())
        ON CONFLICT (card_id, fact_date, COALESCE(employee_id,0), COALESCE(product_id,0))
        DO UPDATE SET actual_value = EXCLUDED.actual_value, target_value = EXCLUDED.target_value,
          achievement_pct = EXCLUDED.achievement_pct, source = EXCLUDED.source, status = 'submitted',
          error_code = EXCLUDED.error_code,
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

  /**
   * Karta uchun ANCESTOR-zanjirni qaytaradi (o'zidan tashqari — eng yaqin ota →
   * root). VERTIKAL kaskad shu zanjir bo'ylab har bir ota-karta agregatini qayta
   * yozadi (bola → ota → otdeleniye → CEO). Faqat O'QISH (parametrlangan sql).
   * @returns ota-karta id massivi (eng yaqindan eng uzoq parent tomon).
   */
  async ancestorChain(cardId: number): Promise<Result<number[]>> {
    const r = await this.exec(sql`
      WITH RECURSIVE up AS (
        SELECT id, parent_id, 0 AS depth FROM org_departments WHERE id = ${cardId}
        UNION ALL
        SELECT d.id, d.parent_id, up.depth + 1
        FROM org_departments d JOIN up ON d.id = up.parent_id
      )
      SELECT id FROM up WHERE depth > 0 ORDER BY depth ASC
    `);
    if (!r.ok) return Err(r.error);
    const ids = r.data
      .map((row) => (row['id'] == null ? null : Number(row['id'])))
      .filter((v): v is number => v != null && Number.isFinite(v));
    return Ok(ids);
  }

  /**
   * VERTIKAL KASKAD-AGREGAT (T18-C2): bitta ota-karta uchun, bir kun, uning BUTUN
   * subtree'sidagi LEAF (ROLLUP bo'lmagan) faktlardan agregat hisoblab, o'sha
   * ota-kartaning kunlik ROLLUP-yozuvini UPSERT qiladi.
   *
   *   achievement_pct = subtree leaf-faktlar o'rtacha achievement% (vizyon: o'rtacha bajarish)
   *   actual_value    = subtree leaf actual yig'indisi (umumiy chiqim)
   *   target_value    = subtree leaf target yig'indisi (umumiy norma)
   *
   * Faqat o'sha kun leaf-fakti BOR bo'lsa yoziladi (FABRIKATSIYA YO'Q — fakt yo'q
   * kunda ota agregati yozilmaydi/o'chirilmaydi). ROLLUP-yozuvlar agregatdan
   * CHIQARILADI (double-count yo'q — faqat haqiqiy yer-faktlar yig'iladi).
   *
   * Idempotent: ota-yozuv (parent_card, fact_date, employee=NULL, product=NULL)
   * kaliti bo'yicha uq_ckp_fact_card_day orqali upsert — qayta-feed takror yaratmaydi.
   *
   * @returns yozilgan/yangilangan ota-yozuv (null = o'sha kun subtree leaf-fakti yo'q → yozilmadi).
   */
  async rollupParentDay(parentCardId: number, date: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        WITH RECURSIVE subtree AS (
          SELECT id FROM org_departments WHERE id = ${parentCardId}
          UNION ALL
          SELECT d.id FROM org_departments d JOIN subtree s ON d.parent_id = s.id
        ),
        agg AS (
          SELECT
            COUNT(f.id)::int                   AS leaf_count,
            ROUND(AVG(f.achievement_pct), 2)   AS avg_achievement,
            SUM(f.actual_value)                AS sum_actual,
            SUM(f.target_value)                AS sum_target
          FROM ckp_fact_values f
          WHERE f.card_id IN (SELECT id FROM subtree)
            AND f.card_id <> ${parentCardId}      -- ota o'z ROLLUP-yozuviga qo'shilmaydi
            AND f.fact_date = ${date}::date
            AND f.source <> ${CKP_ROLLUP_SOURCE}  -- faqat LEAF faktlar (ROLLUP double-count yo'q)
        )
        INSERT INTO ckp_fact_values
          (card_id, employee_id, product_id, fact_date, target_value, actual_value,
           achievement_pct, source, formula_type, status, submitted_at, notes, recorded_by, created_at)
        SELECT
          ${parentCardId}, NULL, NULL, ${date}::date, agg.sum_target, agg.sum_actual,
          COALESCE(agg.avg_achievement, 0), ${CKP_ROLLUP_SOURCE}, NULL, 'submitted', NOW(),
          'Avtomatik kaskad-agregat (' || agg.leaf_count || ' subtree leaf-fakt)', NULL, NOW()
        FROM agg
        WHERE agg.leaf_count > 0
        ON CONFLICT (card_id, fact_date, COALESCE(employee_id,0), COALESCE(product_id,0))
        DO UPDATE SET
          target_value = EXCLUDED.target_value,
          actual_value = EXCLUDED.actual_value,
          achievement_pct = EXCLUDED.achievement_pct,
          source = EXCLUDED.source,
          status = 'submitted',
          submitted_at = NOW(),
          notes = EXCLUDED.notes
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }
}
