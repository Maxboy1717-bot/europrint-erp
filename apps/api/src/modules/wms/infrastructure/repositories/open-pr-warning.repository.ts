/**
 * @module open-pr-warning.repository
 * @description Repository / data-access layer. Wraps raw SQL; returns Result<T>.
 *   Vision 10-warehouse #4 — "Ochiq PR miqdori ogohlantirish bayrog'i" (open-PR-quantity warning flag).
 *   Recomputes the derived open_qty_warning flag on purchase_requests and lists still-open PRs.
 *   Repo owns DB (Qoida 15); the flag is a pure derivation ((qty - qty_fulfilled) > 0 on a non-terminal PR),
 *   so no owner threshold/master-data is needed. The recompute WRITES only rows whose flag changed
 *   (IS DISTINCT FROM), so it is idempotent and never regresses fully-fulfilled/terminal rows.
 * @layer Infrastructure (WMS)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, safeCall } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class OpenPrWarningRepository {
  /**
   * "Comparison job": recompute purchase_requests.open_qty_warning from (qty - qty_fulfilled).
   * TRUE when there is still an open (unfulfilled) quantity on a non-terminal PR. Writes ONLY the
   * rows whose flag actually flips, so it is idempotent (re-run flips 0 rows) and non-regressing.
   * Does NOT auto-edit any PR quantity — it only raises/clears the warning flag.
   */
  async recomputeWarnings(): Promise<Result<{ changed: number }>> {
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        UPDATE purchase_requests pr
        SET open_qty_warning = w.new_flag,
            open_qty_warning_at = CASE WHEN w.new_flag THEN COALESCE(pr.open_qty_warning_at, now()) ELSE NULL END,
            updated_at = now()
        FROM (
          SELECT id,
                 ((qty - qty_fulfilled) > 0
                  AND status NOT IN ('fulfilled','cancelled','rejected','closed','completed','done')) AS new_flag
          FROM purchase_requests
        ) w
        WHERE pr.id = w.id AND pr.open_qty_warning IS DISTINCT FROM w.new_flag
        RETURNING pr.id
      `);
      return { changed: Array.isArray(r.rows) ? r.rows.length : 0 };
    }, 'DB_ERROR');
  }

  /**
   * List purchase requests currently carrying an open-quantity warning, newest-flagged first.
   */
  async findOpenWarnings(lim = 100): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        SELECT id                    AS request_id,
               material_id           AS material_id,
               qty                   AS qty_requested,
               qty_fulfilled         AS qty_fulfilled,
               (qty - qty_fulfilled) AS open_qty,
               status                AS status,
               reason                AS reason,
               preferred_supplier_id AS preferred_supplier_id,
               open_qty_warning_at   AS flagged_at,
               created_at            AS created_at
        FROM purchase_requests
        WHERE open_qty_warning = true
        ORDER BY open_qty_warning_at DESC NULLS LAST, created_at DESC
        LIMIT ${lim}
      `);
      return r.rows as Row[];
    }, 'DB_ERROR');
  }
}
