/**
 * @module ai-daily-report.repository
 * @description A75 — Kunlik AI-hisobot data-access (READ-ONLY). Foydalanuvchining
 *   birlamchi kartasini va o'sha kartaning ЦКП-meta'sini (norma/o'lchov/formula)
 *   o'qiydi. Hech narsa YOZMAYDI — ЦКП-fakt yozish kanonik org-structure endpointi
 *   orqali (modul chegarasi).
 *
 *   Birlamchi karta yo'li resolveCardGate (drizzle-auth.repo) BILAN BIR XIL:
 *     users.card_id (kanonik) → fallback employee_cards (is_active, NOT ended, is_primary).
 *   Karta ЦКП-meta'si org_departments'dan (FAZA-00 kanonik karta-jadval).
 *
 *   Result<T>, parametrlangan sql (Qoida B — injection yo'q).
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, safeCall } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

export interface PrimaryCardCkpMeta {
  cardId: number;
  cardName: string | null;
  ckp: string | null;
  tskpTarget: number | null;
  measurementUnit: string | null;
  formulaType: string | null;
}

interface MetaRow {
  card_id: number | null;
  card_name: string | null;
  ckp: string | null;
  tskp_target: string | number | null;
  measurement_unit: string | null;
  formula_type: string | null;
}

@Injectable()
export class AiDailyReportRepository {
  /**
   * Foydalanuvchining birlamchi kartasi + o'sha kartaning ЦКП-meta'sini o'qiydi.
   * Karta yo'q → Ok(null) (controller 404/empty-state qaytaradi).
   */
  async resolvePrimaryCard(userId: number): Promise<Result<PrimaryCardCkpMeta | null>> {
    const r = await safeCall(async () => {
      const rows = await runQuery<MetaRow>(sql`
        WITH usr AS (
          SELECT id, employee_id, card_id FROM users WHERE id = ${userId}
        ),
        prim AS (
          SELECT COALESCE(
            (SELECT card_id FROM usr),
            (SELECT ec.card_id FROM employee_cards ec
              WHERE ec.employee_id = (SELECT employee_id FROM usr)
                AND ec.is_active = true
                AND (ec.ended_at IS NULL OR ec.ended_at > NOW())
              ORDER BY ec.is_primary DESC, ec.assigned_at DESC NULLS LAST
              LIMIT 1)
          ) AS card_id
        )
        SELECT
          od.id                       AS card_id,
          od.name                     AS card_name,
          od.tskp                     AS ckp,
          od.tskp_target              AS tskp_target,
          od.tskp_measurement_unit    AS measurement_unit,
          od.ckp_formula_type         AS formula_type
        FROM org_departments od
        WHERE od.id = (SELECT card_id FROM prim)
        LIMIT 1
      `);
      return rows.rows[0] ?? null;
    }, 'DB_ERROR');

    if (!r.ok) return Err(r.error);
    const row = r.data;
    if (!row || row.card_id == null) return Ok(null);

    return Ok({
      cardId: Number(row.card_id),
      cardName: row.card_name ?? null,
      ckp: row.ckp ?? null,
      tskpTarget: row.tskp_target == null ? null : Number(row.tskp_target),
      measurementUnit: row.measurement_unit ?? null,
      formulaType: row.formula_type ?? null,
    });
  }
}
