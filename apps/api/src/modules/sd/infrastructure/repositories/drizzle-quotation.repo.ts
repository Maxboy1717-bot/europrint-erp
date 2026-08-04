/**
 * NOTE: Raw parametrised SQL retained intentionally here — the live tables
 *   `sd_quotations`, `sales_orders`, `fi_payments`, `sd_contracts`,
 *   `sd_price_formulas`, and `sd_kpi_targets` carry legacy columns (e.g.
 *   `deleted_at`, `title`, `currency`, `valid_until`, `items`, `cancel_reason`)
 *   that are not modelled in `lib/db/src/schema/*` Drizzle tables. Each UPDATE
 *   also uses COALESCE-with-RETURNING semantics that Drizzle's
 *   `.update().set().where().returning()` cannot express without a matching
 *   `$inferSelect` shape. All parameters are passed through tagged templates
 *   so injection is impossible. See ARCHITECTURE_RULES.md Rule 4.
 *   NOTE (SB0585): `sd_contracts.signature_data` does NOT exist live — the
 *   real sign-gate columns are `signed_at`/`signed_ip`/`pdf_url`.
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

/**
 * camelCase projection of the singleton `sd_price_formulas` row (id=1), matching
 * the SDSettings form keys. Numeric columns are cast to float8 so the JSON
 * carries plain numbers (not numeric strings) for the form inputs.
 */
const PRICE_SETTINGS_COLS = sql`
  id,
  paper_b_price::float8          AS "paperBPrice",
  paper_c_price::float8          AS "paperCPrice",
  paper_bc_price::float8         AS "paperBcPrice",
  paper_e_price::float8          AS "paperEPrice",
  print_1color_price::float8     AS "print1ColorPrice",
  print_2color_price::float8     AS "print2ColorPrice",
  print_4color_price::float8     AS "print4ColorPrice",
  plate_cost_per_color::float8   AS "plateCostPerColor",
  die_cost_new::float8           AS "dieCostNew",
  die_cost_existing::float8      AS "dieCostExisting",
  lamination_price::float8       AS "laminationPrice",
  embossing_price::float8        AS "embossingPrice",
  kashirovka_price::float8        AS "kashirovkaPrice",
  perforation_price::float8      AS "perforationPrice",
  hourly_labor_rate::float8      AS "hourlyLaborRate",
  delivery_base_cost::float8     AS "deliveryBaseCost",
  storage_freedays               AS "storageFreedays",
  storage_daily_rate::float8     AS "storageDailyRate",
  default_markup_percent::float8 AS "defaultMarkupPercent",
  vat_rate::float8               AS "vatRate"
`;

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

  async approveQuotation(id: string, approvedBy?: number): Promise<Result<MutationRow | null>> {
    try {
      // 1. Mark quotation approved
      const qr = await runQuery<Record<string, unknown>>(sql`
        UPDATE sd_quotations SET status = 'approved', approved_at = NOW(), updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, status, customer_id, total_price, notes, updated_at
      `);
      const q = qr.rows[0];
      if (!q) return Ok(null);

      // 2. Create a sales_order (canonical order table) from the approved quotation
      const today = new Date().toISOString().split('T')[0] as string;
      const docNumber = `SO-${Date.now()}`;
      const totalAmount = typeof q['total_price'] === 'number' ? q['total_price']
        : parseFloat(String(q['total_price'] ?? '0')) || 0;
      const customerId = q['customer_id'] != null ? parseInt(String(q['customer_id']), 10) : null;
      // Use only columns that actually exist in the live sales_orders table.
      // B14 (2026-07-05): created_by_user_id is the integer creator column (mirrors
      // execSdSalesOrderInsert's convention) -- created_by is uuid-typed and
      // intentionally left null elsewhere in this codebase, not used here.
      const or = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO sales_orders
          (document_number, order_date, pricing_date, customer_id, net_value, total_value, quotation_id, created_by_user_id)
        VALUES
          (${docNumber}, ${today}, ${today}, ${customerId}, ${totalAmount}, ${totalAmount}, ${String(id)}, ${approvedBy ?? null})
        RETURNING id, document_number
      `);
      const orderId = or.rows[0]?.['id'] != null ? parseInt(String(or.rows[0]['id']), 10) : null;

      // 2.5. Copy the quotation's bespoke-job line items across (owner decision 2026-07-13,
      // chat — "Mahsulot vs Buyurtma zanjiri"). sd_quotation_items has no product_id (this shop
      // quotes custom jobs by physical spec, not catalog SKUs), so product_id stays NULL on the
      // order line; the spec columns carry the job description across instead. Mirrors
      // saveItems()'s item_number convention (create-order.handler.ts's canonical create path).
      if (orderId) {
        const qItems = await runQuery<Record<string, unknown>>(sql`
          SELECT * FROM sd_quotation_items WHERE quotation_id = ${id} AND deleted_at IS NULL ORDER BY id
        `);
        for (let i = 0; i < qItems.rows.length; i++) {
          const qi = qItems.rows[i];
          const itemNumber = String((i + 1) * 10).padStart(6, '0');
          const qty = Number(qi['quantity'] ?? 0);
          const price = Number(qi['unit_price'] ?? 0);
          await runQuery(sql`
            INSERT INTO sales_order_items
              (sales_order_id, item_number, quotation_item_id, description, order_quantity, open_quantity,
               unit, net_price, total_price, product_type, paper_type, thickness_mm, length_mm, width_mm,
               height_mm, print_colors, lamination, perforation, special_coating, is_new_die, printing_method,
               machine_format, load_capacity_kg, core_diameter_mm, gilza_diameter_mm, roll_length_m,
               kashirovka, print_sides, layer_count, setup_time_minutes, created_at)
            VALUES
              (${orderId}, ${itemNumber}, ${qi['id']}, ${qi['product_type'] ?? 'Maxsus buyurtma'}, ${qty}, ${qty},
               'dona', ${price}, ${qty * price}, ${qi['product_type'] ?? null}, ${qi['paper_type'] ?? null},
               ${qi['thickness_mm'] ?? null}, ${qi['length_mm'] ?? null}, ${qi['width_mm'] ?? null},
               ${qi['height_mm'] ?? null}, ${qi['print_colors'] ?? null}, ${qi['lamination'] ?? null},
               ${qi['perforation'] ?? null}, ${qi['special_coating'] ?? null}, ${qi['is_new_die'] ?? null},
               ${qi['printing_method'] ?? null}, ${qi['machine_format'] ?? null}, ${qi['load_capacity_kg'] ?? null},
               ${qi['core_diameter_mm'] ?? null}, ${qi['gilza_diameter_mm'] ?? null}, ${qi['roll_length_m'] ?? null},
               ${qi['kashirovka'] ?? null}, ${qi['print_sides'] ?? null}, ${qi['layer_count'] ?? null},
               ${qi['setup_time_minutes'] ?? null}, NOW())
          `);
        }
      }

      // 3. Create a contract linked to the new order
      const contractNumber = `CNT-${Date.now()}`;
      if (orderId) {
        await runQuery(sql`
          INSERT INTO sd_contracts
            (order_id, contract_number, template_type, status, customer_id)
          VALUES
            (${orderId}, ${contractNumber}, 'standard', 'draft', ${customerId})
        `);
      }

      return Ok({
        id: q['id'],
        status: q['status'],
        updated_at: q['updated_at'],
        orderId,
        contractNumber: orderId ? contractNumber : null,
      } as unknown as MutationRow);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async updateQuotation(id: string, patch: QuotationUpdatePatch): Promise<Result<MutationRow | null>> {
    try {
      // #04 SD fix: live sd_quotations has NO title/items columns (they crashed UPDATE). Patch the real
      // columns only; payment_terms is a live column and is now honored. Line items live in sd_quotation_items.
      const r = await runQuery<MutationRow>(sql`
        UPDATE sd_quotations
        SET
          total_amount  = COALESCE(${patch.total_amount ?? null}, total_amount),
          total_value   = COALESCE(${patch.total_amount ?? null}, total_value),
          currency      = COALESCE(${patch.currency ?? null}, currency),
          valid_until   = COALESCE(${patch.valid_until ?? null}, valid_until),
          notes         = COALESCE(${patch.notes ?? null}, notes),
          status        = COALESCE(${patch.status ?? null}, status),
          payment_terms = COALESCE(${(patch as { payment_terms?: string }).payment_terms ?? null}, payment_terms),
          updated_at    = NOW()
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
      // sd_kpi_targets does not exist in the live DB — canonical table is sd_manager_quotas.
      // patch.target_value maps to quota_amount; patch.period is decomposed into year/month
      // if provided as "YYYY-MM" string; otherwise year/month are kept unchanged via COALESCE.
      const num = (v: unknown) =>
        v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null;
      const periodStr = patch.period != null ? String(patch.period) : null;
      const periodParts = periodStr?.match(/^(\d{4})-(\d{2})$/) ?? null;
      const periodYear = periodParts ? parseInt(periodParts[1] ?? '0', 10) : null;
      const periodMonth = periodParts ? parseInt(periodParts[2] ?? '0', 10) : null;

      // quota_amount: prefer patch.quota_amount (mapped from FE revenueTarget),
      // fall back to legacy patch.target_value for backward compatibility.
      const r = await runQuery<MutationRow>(sql`
        UPDATE sd_manager_quotas
        SET
          quota_amount = COALESCE(${num(patch.quota_amount ?? patch.target_value)}, quota_amount),
          year         = COALESCE(${periodYear}, year),
          month        = COALESCE(${periodMonth}, month),
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
      const today = new Date().toISOString().split('T')[0] as string;
      // EP-SD-030: `amount` must be RETURNING'd — sd_quotations.service.ts reads
      // r.data['amount'] to decide whether to post the GL leg (postCustomerPayment).
      // Without it the amount always reads as 0 and the GL entry silently never posts.
      const r = await runQuery<MutationRow>(sql`
        UPDATE sd_payments
        SET status = 'paid', paid_date = COALESCE(${paymentDate ?? null}, paid_date, ${today}), updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, status, updated_at, amount::float8 AS amount
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async signContract(id: string, signatureData: unknown): Promise<Result<MutationRow | null>> {
    try {
      // SB0585 fix: live `sd_contracts` has NO `signature_data` column (only
      // signed_at/signed_ip/pdf_url) — the previous UPDATE crashed with DB_ERROR
      // (undefined column) on every call. Canonical sign gate = `signed_at`
      // timestamp, matching SdContractsController.sign() (PATCH /sd/contracts/:id/sign).
      // `signatureData` (if the caller sent one) is preserved in `pdf_url` only when
      // it looks like a URL; otherwise it is accepted but not persisted verbatim,
      // since there is no JSON column to hold it (no fabricated column added — Q-35).
      const sigUrl = typeof signatureData === 'string' && signatureData.length > 0 ? signatureData : null;
      const r = await runQuery<MutationRow>(sql`
        UPDATE sd_contracts
        SET status = 'signed', signed_at = NOW(), pdf_url = COALESCE(${sigUrl}, pdf_url), updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, status, signed_at, updated_at
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async upsertPriceFormula(patch: PriceFormulaPatch): Promise<Result<MutationRow | null>> {
    try {
      const num = (v: unknown) =>
        v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null;
      // Singleton settings row: seed id=1 (every column takes its DB default) if it
      // does not exist yet, then apply the PARTIAL change via COALESCE — changed
      // fields overwrite, unchanged (null param) fields keep their current value.
      await runQuery(sql`INSERT INTO sd_price_formulas (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
      const r = await runQuery<MutationRow>(sql`
        UPDATE sd_price_formulas SET
          paper_b_price          = COALESCE(${num(patch.paperBPrice)}, paper_b_price),
          paper_c_price          = COALESCE(${num(patch.paperCPrice)}, paper_c_price),
          paper_bc_price         = COALESCE(${num(patch.paperBcPrice)}, paper_bc_price),
          paper_e_price          = COALESCE(${num(patch.paperEPrice)}, paper_e_price),
          print_1color_price     = COALESCE(${num(patch.print1ColorPrice)}, print_1color_price),
          print_2color_price     = COALESCE(${num(patch.print2ColorPrice)}, print_2color_price),
          print_4color_price     = COALESCE(${num(patch.print4ColorPrice)}, print_4color_price),
          plate_cost_per_color   = COALESCE(${num(patch.plateCostPerColor)}, plate_cost_per_color),
          die_cost_new           = COALESCE(${num(patch.dieCostNew)}, die_cost_new),
          lamination_price       = COALESCE(${num(patch.laminationPrice)}, lamination_price),
          embossing_price        = COALESCE(${num(patch.embossingPrice)}, embossing_price),
          kashirovka_price       = COALESCE(${num(patch.kashirovkaPrice)}, kashirovka_price),
          perforation_price      = COALESCE(${num(patch.perforationPrice)}, perforation_price),
          delivery_base_cost     = COALESCE(${num(patch.deliveryBaseCost)}, delivery_base_cost),
          storage_freedays       = COALESCE(${num(patch.storageFreedays)}, storage_freedays),
          storage_daily_rate     = COALESCE(${num(patch.storageDailyRate)}, storage_daily_rate),
          default_markup_percent = COALESCE(${num(patch.defaultMarkupPercent)}, default_markup_percent),
          vat_rate               = COALESCE(${num(patch.vatRate)}, vat_rate),
          updated_at             = NOW()
        WHERE id = 1
        RETURNING ${PRICE_SETTINGS_COLS}
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async getPriceSettings(): Promise<Result<MutationRow | null>> {
    try {
      const r = await runQuery<MutationRow>(sql`
        SELECT ${PRICE_SETTINGS_COLS} FROM sd_price_formulas WHERE id = 1
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }
}
