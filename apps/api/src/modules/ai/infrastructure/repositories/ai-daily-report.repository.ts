/**
 * @module ai-daily-report.repository
 * @description A75 / T8-12 — Kunlik AI-hisobot data-access. Foydalanuvchining
 *   birlamchi kartasini va o'sha kartaning ЦКП-meta'sini (norma/o'lchov/formula)
 *   o'qiydi. ЦКП-FAKTni YOZMAYDI — fakt yozish kanonik org-structure endpointi
 *   orqali (modul chegarasi).
 *
 *   T8-12 (kunlik AI-chat log STRUKTURA): har kunlik-hisobot chat-navbati
 *   (xodim matni + AI xulosasi) `ai_ckp_chat_logs` jadvaliga yoziladi. Bu fakt
 *   EMAS — faqat suhbat tarixi (audit/AI-kontekst). employee_id bo'yicha kalit
 *   (jadval employee_id NOT NULL kutadi). AI-kalit yo'q bo'lsa AI navbati
 *   yozilmaydi (faqat xodim matni); soxta AI-javob YOZILMAYDI (Q-40).
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
  /** Chat-log kaliti (ai_ckp_chat_logs.employee_id NOT NULL). users.employee_id. */
  employeeId: number | null;
}

/** Bitta chat-navbati (user matni yoki assistant xulosasi). */
export interface CkpChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * T12-08 — Kunlik AI-savol cron uchun: mashinasiz (MES'siz) xodimga biriktirilgan,
 * ЦКП-meta'si bor karta. Cron har biriga "Bugun qancha bajardingiz?" degan ЦКП-savolni
 * yo'llaydi (AI bo'lsa AI-generatsiya, bo'lmasa statik savol — savol FAKT EMAS, Q-40).
 */
export interface MachinelessCkpCard {
  cardId: number;
  cardName: string | null;
  ckp: string | null;
  tskpTarget: number | null;
  measurementUnit: string | null;
  /** ai_ckp_chat_logs.employee_id (NOT NULL) — kartaga biriktirilgan xodim. */
  employeeId: number;
}

interface MetaRow {
  card_id: number | null;
  card_name: string | null;
  ckp: string | null;
  tskp_target: string | number | null;
  measurement_unit: string | null;
  formula_type: string | null;
  employee_id: number | null;
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
          od.ckp_formula_type         AS formula_type,
          (SELECT employee_id FROM usr) AS employee_id
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
      employeeId: row.employee_id == null ? null : Number(row.employee_id),
    });
  }

  /**
   * T8-12 — Kunlik AI-chat suhbat navbatlarini `ai_ckp_chat_logs` ga yozadi.
   * Bir sessiya (session_id) ostida tartibli: avval xodim matni ('user'),
   * keyin (agar AI ishlagan bo'lsa) AI xulosasi ('assistant'). Bo'sh content
   * yoki employeeId yo'q bo'lsa o'sha navbat tashlanadi (jadval NOT NULL).
   * Parametrlangan INSERT (Qoida B). Suhbat-log — fakt EMAS (modul chegarasi).
   */
  async logChatTurns(
    employeeId: number,
    sessionId: string,
    turns: CkpChatTurn[],
  ): Promise<Result<number>> {
    const valid = (Array.isArray(turns) ? turns : []).filter(
      (t) => t && typeof t.content === 'string' && t.content.trim().length > 0,
    );
    if (valid.length === 0) return Ok(0);

    return safeCall(async () => {
      let written = 0;
      for (const turn of valid) {
        await runQuery(sql`
          INSERT INTO ai_ckp_chat_logs (employee_id, role, content, session_id)
          VALUES (${employeeId}, ${turn.role}, ${turn.content.slice(0, 8000)}, ${sessionId})
        `);
        written += 1;
      }
      return written;
    }, 'DB_ERROR');
  }

  /**
   * T12-08 — Kunlik AI-savol cron MANBAI: o'sha kun (factDate) hali ЦКП-savol
   * yo'llanmagan, mashinasiz xodimga biriktirilgan, ЦКП-meta'si bor kartalar.
   *
   * "Mashinasiz" = xodim mashina-operatori EMAS (employees.is_machine_operator IS NOT TRUE).
   * Mashina-operatorlari ЦКП'ni IoT/MES avto-feed orqali oladi (operator-hourly-invoice.cron) —
   * ularga kunlik AI-savol yo'llanmaydi (takror yo'q).
   *
   * Karta→xodim yo'li: avval karta head_user_id (kanonik), keyin employee_cards
   * (is_primary, is_active, NOT ended) birlamchi biriktirma. employee_id NULL bo'lsa
   * karta tashlanadi (chat-log employee_id NOT NULL kutadi).
   *
   * Idempotent: o'sha kun session_id (`ckp-<cardId>-<factDate>`) uchun ai_ckp_chat_logs'da
   * yozuv bo'lsa karta tashlanadi — cron qayta yurganda takror savol YO'Q.
   *
   * Faqat O'QISH (yon-ta'sir yo'q), parametrlangan sql (Qoida B).
   */
  async findMachinelessCardsNeedingQuestion(factDate: string): Promise<Result<MachinelessCkpCard[]>> {
    const r = await safeCall(async () => {
      const rows = await runQuery<MetaRow>(sql`
        SELECT
          od.id                       AS card_id,
          od.name                     AS card_name,
          od.tskp                     AS ckp,
          od.tskp_target              AS tskp_target,
          od.tskp_measurement_unit    AS measurement_unit,
          od.ckp_formula_type         AS formula_type,
          emp.id                      AS employee_id
        FROM org_departments od
        -- Kartaga biriktirilgan xodim: head_user_id (kanonik) yoki birlamchi employee_cards
        JOIN LATERAL (
          SELECT COALESCE(
            (SELECT u.employee_id FROM users u WHERE u.id = od.head_user_id),
            (SELECT ec.employee_id FROM employee_cards ec
              WHERE ec.card_id = od.id
                AND ec.is_active = true
                AND (ec.ended_at IS NULL OR ec.ended_at > NOW())
              ORDER BY ec.is_primary DESC, ec.assigned_at DESC NULLS LAST
              LIMIT 1)
          ) AS employee_id
        ) link ON TRUE
        JOIN employees emp ON emp.id = link.employee_id
        WHERE od.tskp IS NOT NULL
          AND COALESCE(emp.is_machine_operator, false) = false
          AND emp.deleted_at IS NULL
          -- O'sha kun savol yo'llanmagan (idempotent)
          AND NOT EXISTS (
            SELECT 1 FROM ai_ckp_chat_logs l
            WHERE l.session_id = 'ckp-' || od.id::text || '-' || ${factDate}
          )
        ORDER BY od.id
      `);
      return Array.isArray(rows.rows) ? rows.rows : [];
    }, 'DB_ERROR');

    if (!r.ok) return Err(r.error);
    const mapped: MachinelessCkpCard[] = [];
    for (const row of r.data) {
      if (row.card_id == null || row.employee_id == null) continue;
      mapped.push({
        cardId: Number(row.card_id),
        cardName: row.card_name ?? null,
        ckp: row.ckp ?? null,
        tskpTarget: row.tskp_target == null ? null : Number(row.tskp_target),
        measurementUnit: row.measurement_unit ?? null,
        employeeId: Number(row.employee_id),
      });
    }
    return Ok(mapped);
  }
}
