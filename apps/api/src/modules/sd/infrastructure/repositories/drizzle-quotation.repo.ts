/**
 * NOTE: Raw parametrised SQL retained intentionally here — the live tables
 *   `sd_quotations`, `sales_orders`, `fi_payments`, `sd_contracts`,
 *   `sd_price_formulas`, and `sd_kpi_targets` carry legacy columns (e.g.
 *   `deleted_at`, `title`, `currency`, `valid_until`, `items`, `cancel_reason`,
 *   `signature_data`) that are not modelled in `lib/db/src/schema/*` Drizzle
 *   tables. Each UPDATE also uses COALESCE-with-RETURNING semantics that
 *   Drizzle's `.update().set().where().returning()` cannot express without a
 *   matching `$inferSelect` shape. All parameters are passed through tagged
 *   templates so injection is impossible. See ARCHITECTURE_RULES.md Rule 4.
 */
/**
 * @module drizzle-quotation.repo
 * @description Concrete repository for mutations triggered by
 *   `SdQuotationsController`. Wraps each UPDATE/DELETE in `runQuery` and
 *   returns the first returned row (or `null`) inside a `Result`. Errors
 *   from the database are converted to `AppErr('DB_ERROR', ...)`.
 * @layer Infrastructure (SD)
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  IQuotationRepo,
  MutationRow,
  QuotationUpdatePatch,
  KpiTargetPatch,
  PriceFormulaPatch,
} from '../../domain/repositories/i-quotation.repo';

@Injectable()
export class DrizzleQuotationRepo implements IQuotationRepo {
  async sendQuotation(id: string): Promise<Result<MutationRow | null>> {
    try {
      const r = await runQuery<MutationRow>(sql`
        UPDATE sd_quotations SET status = 'sent', updated_at = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id, status, updated_at
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async approveQuotation(id: string): Promise<Result<MutationRow | null>> {
    try {
      const r = await runQuery<MutationRow>(sql`
        UPDATE sd_quotations SET status = 'approved', updated_at = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id, status, updated_at
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async updateQuotation(id: string, patch: QuotationUpdatePatch): Promise<Result<MutationRow | null>> {
    try {
      const itemsJson = patch.items !== undefined && patch.items !== null
        ? JSON.stringify(patch.items)
        : null;
      const r = await runQuery<MutationRow>(sql`
        UPDATE sd_quotations
        SET
          title        = COALESCE(${patch.title ?? null}, title),
          total_amount = COALESCE(${patch.total_amount ?? null}, total_amount),
          currency     = COALESCE(${patch.currency ?? null}, currency),
          valid_until  = COALESCE(${patch.valid_until ?? null}, valid_until),
          notes        = COALESCE(${patch.notes ?? null}, notes),
          status       = COALESCE(${patch.status ?? null}, status),
          items        = COALESCE(${itemsJson}, items),
          updated_at   = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING *
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async softDeleteQuotation(id: string): Promise<Result<MutationRow | null>> {
    try {
      const r = await runQuery<MutationRow>(sql`
        UPDATE sd_quotations SET deleted_at = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id, deleted_at
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async updateKpiTarget(id: string, patch: KpiTargetPatch): Promise<Result<MutationRow | null>> {
    try {
      const r = await runQuery<MutationRow>(sql`
        UPDATE sd_kpi_targets
        SET
          target_value = COALESCE(${patch.target_value ?? null}, target_value),
          period       = COALESCE(${patch.period ?? null}, period),
          updated_at   = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async cancelSalesOrder(id: string, reason: unknown): Promise<Result<MutationRow | null>> {
    try {
      const r = await runQuery<MutationRow>(sql`
        UPDATE sales_orders
        SET status = 'cancelled', cancel_reason = ${reason ?? null}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, status, updated_at
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async markPaymentPaid(id: string, paymentDate: unknown): Promise<Result<MutationRow | null>> {
    try {
      const r = await runQuery<MutationRow>(sql`
        UPDATE fi_payments
        SET status = 'paid', payment_date = COALESCE(${paymentDate ?? null}, payment_date), updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, status, updated_at
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async signContract(id: string, signatureData: unknown): Promise<Result<MutationRow | null>> {
    try {
      const sigJson = signatureData !== undefined && signatureData !== null
        ? JSON.stringify(signatureData)
        : null;
      const r = await runQuery<MutationRow>(sql`
        UPDATE sd_contracts
        SET status = 'signed', signature_data = ${sigJson}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, status, updated_at
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async upsertPriceFormula(patch: PriceFormulaPatch): Promise<Result<MutationRow | null>> {
    try {
      const r = await runQuery<MutationRow>(sql`
        UPDATE sd_price_formulas
        SET
          name        = COALESCE(${patch.name ?? null}, name),
          formula     = COALESCE(${patch.formula ?? null}, formula),
          description = COALESCE(${patch.description ?? null}, description),
          updated_at  = NOW()
        WHERE id = ${patch.id ?? null}
        RETURNING *
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }
}
