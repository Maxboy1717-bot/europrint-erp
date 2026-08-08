/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - The aggregation `SUM(quantity)::numeric` over pos_movement_lines plus the
 *     stock-ledger comparison join used to detect topshir↔qabul mismatch, in a
 *     single typed round-trip (driver returns text for numeric otherwise).
 *   - The optional ON CONFLICT (movement_id, rule_code) idempotent upsert that
 *     keeps the movement-completed listener safe to re-run (no duplicate flags).
 *   pos_anomaly_flags is an additive table created by
 *   docs/migration/2026-06-27-pos-anomaly-flags.sql — not part of the Drizzle
 *   schema surface, so raw SQL is the canonical access path here.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module pos-anomaly.repository
 * @description Repository / data-access layer. Wraps raw SQL (additive table); returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { safeCall, Result } from '@common/result';

/** A completed movement header + line-aggregate snapshot used by the rule engine. */
export interface AnomalyMovementRow {
  id:               number;
  movement_number:  string | null;
  movement_type:    string | null;
  status:           string | null;
  created_by:       number | null;
  created_at:       string | null;   // ISO timestamp (movement creation)
  total_amount:     string | number; // base-currency total
  declared_qty:     string | number; // SUM(quantity) across lines
  line_count:       number;
}

/** Material-level norma comparison row (norma vs declared/actual consumption). */
export interface AnomalyNormRow {
  material_id:       number;
  material_name:     string | null;
  declared_qty:      string | number;
  norm_per_1000:     string | number | null;
  unit:              string | null;
  /** FAZA J — qaysi bo'lim normasi ishlatilgani (null = global norma). */
  department_code:   string | null;
}

export interface AnomalyFlagInsert {
  movementId:      number | null;
  movementNumber:  string | null;
  ruleCode:        string;
  severity:        'info' | 'warning' | 'critical';
  title:           string;
  detail:          string | null;
  metrics:         Record<string, unknown>;
  createdBy:       number | null;
}

@Injectable()
export class PosAnomalyRepository {
  /** Movement header + declared quantity aggregate for a completed movement. */
  async getMovementSnapshot(movementId: number): Promise<Result<AnomalyMovementRow | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<AnomalyMovementRow>(sql`
        SELECT
          pm.id,
          pm.movement_number,
          pm.movement_type,
          pm.status,
          pm.created_by,
          pm.created_at,
          COALESCE(pm.total_amount, 0)::numeric            AS total_amount,
          COALESCE(SUM(pml.quantity), 0)::numeric          AS declared_qty,
          COUNT(pml.id)::int                               AS line_count
        FROM pos_movements pm
        LEFT JOIN pos_movement_lines pml ON pml.movement_id = pm.id
        WHERE pm.id = ${movementId}
        GROUP BY pm.id
        LIMIT 1
      `);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  /**
   * Stock-ledger recorded absolute quantity for this movement.
   * Topshir↔qabul tekshiruvi: e'lon qilingan miqdor (lines) ↔ ledgerga yozilgan.
   * Ledger yo'q bo'lsa null qaytadi → qoida skip qiladi (Q-40, fabrikatsiya yo'q).
   */
  async getLedgerRecordedQty(movementId: number): Promise<Result<number | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<{ recorded_qty: string | number | null }>(sql`
        SELECT COALESCE(SUM(ABS(quantity)), 0)::numeric AS recorded_qty
        FROM pos_stock_ledger
        WHERE movement_id = ${movementId}
      `);
      const raw = rows[0]?.recorded_qty;
      if (raw == null) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    }, 'DB_ERROR');
  }

  /**
   * Per-material declared quantity joined to its active norma (material_norms).
   * material_norms bo'sh bo'lsa (hozir 0 qator) — bo'sh ro'yxat qaytadi → norma
   * qoidasi avtomatik skip bo'ladi (graceful, fabrikatsiya yo'q).
   *
   * FAZA J — bo'lim-darajasidagi norma ustunligi: harakatning `bulim` maydoni
   * material_norms.department_code'ga mos kelsa o'sha bo'lim-normasi ishlatiladi,
   * aks holda global (department_code IS NULL) normaga tushadi (LATERAL, bir
   * material uchun bitta eng mos norma — dublikat hit yo'q).
   */
  async getNormComparison(movementId: number): Promise<Result<AnomalyNormRow[]>> {
    return safeCall(async () => {
      const rows = await typedExecute<AnomalyNormRow>(sql`
        WITH declared AS (
          SELECT pml.material_id, SUM(pml.quantity) AS declared_qty
          FROM pos_movement_lines pml
          WHERE pml.movement_id = ${movementId}
          GROUP BY pml.material_id
        ), movement_dept AS (
          SELECT bulim FROM pos_movements WHERE id = ${movementId}
        )
        SELECT
          d.material_id,
          norm.material_name,
          d.declared_qty::numeric        AS declared_qty,
          norm.norm_quantity_per_1000     AS norm_per_1000,
          norm.unit,
          norm.department_code
        FROM declared d
        JOIN LATERAL (
          SELECT mn.material_name, mn.norm_quantity_per_1000, mn.unit, mn.department_code
          FROM material_norms mn, movement_dept md
          WHERE mn.material_id = d.material_id
            AND mn.is_active = true
            AND mn.deleted_at IS NULL
            AND mn.norm_quantity_per_1000 IS NOT NULL
            AND mn.norm_quantity_per_1000 > 0
            AND (mn.department_code = md.bulim OR mn.department_code IS NULL)
          ORDER BY (mn.department_code IS NOT NULL) DESC
          LIMIT 1
        ) norm ON true
      `);
      return Array.isArray(rows) ? rows : [];
    }, 'DB_ERROR');
  }

  /**
   * Idempotent insert — (movement_id, rule_code) unique partial index makes a
   * re-run of the listener a no-op for the same flag. Returns inserted id, or
   * null when the flag already existed (ON CONFLICT DO NOTHING).
   */
  async insertFlag(input: AnomalyFlagInsert): Promise<Result<number | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<{ id: number }>(sql`
        INSERT INTO pos_anomaly_flags
          (movement_id, movement_number, rule_code, severity, title, detail,
           metrics, detected_by, status, created_by, created_at)
        VALUES
          (${input.movementId}, ${input.movementNumber}, ${input.ruleCode},
           ${input.severity}, ${input.title}, ${input.detail},
           ${JSON.stringify(input.metrics)}::jsonb, 'rule', 'open',
           ${input.createdBy}, NOW())
        ON CONFLICT (movement_id, rule_code) WHERE movement_id IS NOT NULL
        DO NOTHING
        RETURNING id
      `);
      return rows[0]?.id ?? null;
    }, 'DB_ERROR');
  }

  /** Open anomaly flags (для дашборда боссу) — newest first, paginated. */
  async listOpen(limit: number, offset: number): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await typedExecute<Record<string, unknown>>(sql`
        SELECT id, movement_id, movement_number, rule_code, severity, title,
               detail, metrics, status, created_by, created_at
        FROM pos_anomaly_flags
        WHERE status = 'open'
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      return Array.isArray(rows) ? rows : [];
    }, 'DB_ERROR');
  }

  /**
   * Anomaly flags with optional filters (POS Monitor dashboard READ — ADDITIVE).
   * `status`/`severity` null → no filter. Newest first, paginated.
   * Data yo'q → bo'sh ro'yxat (Q-40).
   */
  async listAnomalies(
    status: string | null,
    severity: string | null,
    limit: number,
    offset: number,
  ): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await typedExecute<Record<string, unknown>>(sql`
        SELECT id, movement_id, movement_number, rule_code, severity, title,
               detail, metrics, status, created_by, created_at
        FROM pos_anomaly_flags
        WHERE (${status}::text   IS NULL OR status   = ${status})
          AND (${severity}::text IS NULL OR severity = ${severity})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      return Array.isArray(rows) ? rows : [];
    }, 'DB_ERROR');
  }

  /** Single anomaly flag by id (POS Monitor detail READ — ADDITIVE). Yo'q → null. */
  async getById(id: number): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<Record<string, unknown>>(sql`
        SELECT id, movement_id, movement_number, rule_code, severity, title,
               detail, metrics, status, created_by, created_at
        FROM pos_anomaly_flags
        WHERE id = ${id}
        LIMIT 1
      `);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }
}
