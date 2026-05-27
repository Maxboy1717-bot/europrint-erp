/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - SUM(quantity * COALESCE(unit_price, 0))::numeric line-total aggregation
 *     in a single round-trip — Drizzle exposes sum() helper but not the
 *     multiply-then-coalesce expression nor the ::numeric cast required so
 *     the driver returns a number instead of pg's default text-for-numeric.
 *   - "Smart NULL" filter pattern: `(${param}::date IS NULL OR col = ${param})`
 *     used four times in getJournal() to make every filter optional without
 *     rebuilding the SQL string per request — Drizzle's where()-chaining
 *     requires conditional .where() calls and loses query-plan caching.
 *   - COALESCE(total_amount, 0)::numeric AS total_amount + COALESCE(exchange_rate, 1)::numeric
 *     projection-side defaulting for nullable monetary columns.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module auto-gl-posting.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { safeCall, Result } from '@common/result';

interface GlPostingInsert {
  movementId:    number;
  debitAccount:  string;
  creditAccount: string;
  amount:        number;
  currency:      string;
  exchangeRate:  number;
  amountBase:    number;
  description:   string;
}

@Injectable()
export class AutoGlPostingRepository {
  async findMovement(movementId: number): Promise<{
    id: number; movement_number: string; movement_type: string; status: string;
    total_amount: string | number; currency: string; exchange_rate: string | number;
  } | null> {
    const rows = await typedExecute<{
      id: number; movement_number: string; movement_type: string; status: string;
      total_amount: string | number; currency: string; exchange_rate: string | number;
    }>(sql`
      SELECT pm.id, pm.movement_number, pm.movement_type, pm.status,
             COALESCE(pm.total_amount, 0)::numeric AS total_amount,
             pm.currency, COALESCE(pm.exchange_rate, 1)::numeric AS exchange_rate
      FROM pos_movements pm
      WHERE pm.id = ${movementId}
      LIMIT 1
    `);
    return rows[0] ?? null;
  }

  async sumLines(movementId: number): Promise<number> {
    const rows = await typedExecute<{ total: string | number }>(sql`
      SELECT COALESCE(SUM(quantity * COALESCE(unit_price, 0)), 0)::numeric AS total
      FROM pos_movement_lines
      WHERE movement_id = ${movementId}
    `);
    return Number(rows[0]?.total ?? 0);
  }

  async countExistingPostings(movementId: number): Promise<number> {
    const rows = await typedExecute<{ cnt: number }>(sql`
      SELECT COUNT(*)::int AS cnt FROM pos_gl_postings WHERE movement_id = ${movementId}
    `);
    return rows[0]?.cnt ?? 0;
  }

  async insertPosting(entry: GlPostingInsert): Promise<Result<void>> {
    return safeCall(async () => {
      await db.execute(sql`
        INSERT INTO pos_gl_postings
          (movement_id, debit_account, credit_account, amount, currency,
           exchange_rate, amount_base, description, posted_by, posting_date, created_at)
        VALUES
          (${entry.movementId}, ${entry.debitAccount}, ${entry.creditAccount}, ${entry.amount},
           ${entry.currency}, ${entry.exchangeRate}, ${entry.amountBase},
           ${entry.description}, 'AI', CURRENT_DATE, NOW())
      `);
    }, 'DB_ERROR');
  }

  async listForMovement(movementId: number): Promise<unknown[]> {
    return typedExecute<unknown>(sql`
      SELECT id, debit_account, credit_account, amount, currency,
             amount_base, description, posted_by, is_approved,
             posting_date, created_at
      FROM pos_gl_postings
      WHERE movement_id = ${movementId}
      ORDER BY id
    `);
  }

  async getJournal(filters?: {
    dateFrom?: string; dateTo?: string;
    debitAccount?: string; creditAccount?: string;
    limit?: number;
  }): Promise<unknown[]> {
    const lim = Math.min(filters?.limit ?? 200, 1000);
    return typedExecute<unknown>(sql`
      SELECT
        gl.id,
        gl.movement_id        AS "movementId",
        pm.movement_number    AS "movementNumber",
        pm.movement_type      AS "movementType",
        gl.debit_account      AS "debitAccount",
        gl.credit_account     AS "creditAccount",
        gl.amount::numeric    AS amount,
        gl.currency,
        gl.amount_base::numeric AS "amountBase",
        gl.description,
        gl.posted_by          AS "postedBy",
        gl.is_approved        AS "isApproved",
        gl.posting_date       AS "postingDate",
        gl.created_at         AS "createdAt"
      FROM pos_gl_postings gl
      LEFT JOIN pos_movements pm ON pm.id = gl.movement_id
      WHERE (${filters?.dateFrom     ?? null}::date IS NULL OR gl.posting_date >= ${filters?.dateFrom     ?? null}::date)
        AND (${filters?.dateTo       ?? null}::date IS NULL OR gl.posting_date <= ${filters?.dateTo       ?? null}::date)
        AND (${filters?.debitAccount ?? null}::text IS NULL OR gl.debit_account  = ${filters?.debitAccount ?? null})
        AND (${filters?.creditAccount?? null}::text IS NULL OR gl.credit_account = ${filters?.creditAccount?? null})
      ORDER BY gl.posting_date DESC, gl.id DESC
      LIMIT ${lim}
    `);
  }
}
