/**
 * @module mm-vendor-invoice.repository
 * @description Repository / data-access layer for the MM vendor-invoice money flows.
 *   Raw SQL is used deliberately (Qoida 4): every query below is a LATERAL /
 *   multi-table aggregate that Drizzle's query builder cannot express.
 *
 *   Canonical tables (verified against the live `europrint` DB, 2026-08-07):
 *     - `vendor_invoices` / `vendor_invoice_lines` — BASE TABLES
 *     - `three_way_match_results`                  — BASE TABLE (append-only audit trail)
 *     - `invoice_payments`                         — BASE TABLE (AP payments)
 *     - `mm_purchase_orders` / `mm_goods_receipts` / `mm_vendors` are pass-through
 *       VIEWs; every WRITE therefore targets the base tables `purchase_orders`,
 *       `goods_receipts`, `vendors`.
 * @layer Infrastructure (MM)
 */

import { Ok, Err, Result, AppErr, safeCall } from '@common/result';
import { Injectable, Logger } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import type {
  IMmVendorInvoiceRepo,
  MatchOutcomeWrite,
  PaymentStatusRule,
  RecordedPayment,
  Row,
  ThreeWayMatchWrite,
  VendorInvoiceMatchBasis,
  VendorInvoicePaymentWrite,
} from '../../domain/repositories/i-mm-vendor-invoice.repo';

/**
 * `invoice_payments.purchase_invoice_id` is a VARCHAR with no FK and is shared
 * between the (unused) `purchase_invoices` flow and this vendor-invoice flow —
 * ids of both tables start at 1, so a bare numeric key WOULD collide and a future
 * AP report could double-count real money. The `VI-` prefix makes the owner of
 * each payment row unambiguous. Proper fix = a dedicated `vendor_invoice_id`
 * INTEGER column, which needs owner schema approval (Q-35).
 */
const paymentKey = (invoiceId: number): string => `VI-${invoiceId}`;

const num = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

@Injectable()
export class MmVendorInvoiceRepository implements IMmVendorInvoiceRepo {
  private readonly logger = new Logger(MmVendorInvoiceRepository.name);

  async materialExists(materialId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      // material_cards = canonical material master (memory: reference_live_db_location).
      // mm_materials / raw_materials are the MM-side integer-keyed masters that the
      // existing MM queries already join (mm-dashboard.repository.ts:39, PO items
      // `raw_material_id`), so a hit in any of the three counts.
      // ⚠ `materials` is deliberately NOT checked — its `id` is UUID, not integer.
      const r = await runQuery<{ found: boolean }>(sql`
        SELECT (
          EXISTS (SELECT 1 FROM material_cards WHERE id = ${materialId})
          OR EXISTS (SELECT 1 FROM mm_materials  WHERE id = ${materialId})
          OR EXISTS (SELECT 1 FROM raw_materials WHERE id = ${materialId})
        ) AS found
      `);
      return Boolean(r.rows[0]?.found);
    }, 'DB_ERROR');
  }

  /**
   * Suppliers for one material: purchase history (from the canonical
   * `purchase_order_items` writer, drizzle-mm.repo.ts:110) plus the current
   * price-list tier. A vendor is listed when it has EITHER history OR a price
   * tier for the material.
   */
  async findMaterialSuppliers(materialId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        SELECT
          v.id                                        AS vendor_id,
          v.name                                      AS vendor_name,
          v.vendor_code,
          v.phone,
          v.email,
          v.rating                                    AS vendor_rating,
          v.payment_terms,
          v.currency,
          COALESCE(h.order_count, 0)::int             AS order_count,
          COALESCE(h.total_quantity, 0)::numeric(18,3) AS total_quantity,
          COALESCE(h.total_amount, 0)::numeric(18,2)   AS total_amount,
          h.min_unit_price,
          h.max_unit_price,
          h.avg_unit_price,
          h.last_unit_price,
          h.last_order_at,
          pl.unit_price                               AS price_list_price,
          pl.min_qty                                  AS price_list_min_qty
        FROM vendors v
        LEFT JOIN LATERAL (
          SELECT
            COUNT(DISTINCT po.id)                                       AS order_count,
            SUM(poi.quantity)                                           AS total_quantity,
            SUM(poi.total_price)                                        AS total_amount,
            MIN(poi.unit_price)::numeric(18,2)                          AS min_unit_price,
            MAX(poi.unit_price)::numeric(18,2)                          AS max_unit_price,
            AVG(poi.unit_price)::numeric(18,2)                          AS avg_unit_price,
            (ARRAY_AGG(poi.unit_price ORDER BY poi.id DESC))[1]::numeric(18,2) AS last_unit_price,
            MAX(po.created_at)                                          AS last_order_at
          FROM purchase_order_items poi
          JOIN purchase_orders po
            ON po.id = poi.purchase_order_id
           AND po.deleted_at IS NULL
          WHERE poi.material_id = ${materialId}
            AND po.vendor_id = v.id
        ) h ON TRUE
        LEFT JOIN LATERAL (
          SELECT unit_price, min_qty
          FROM supplier_price_tiers
          WHERE material_id = ${materialId}
            AND supplier_id = v.id
          ORDER BY id DESC
          LIMIT 1
        ) pl ON TRUE
        WHERE v.deleted_at IS NULL
          AND (COALESCE(h.order_count, 0) > 0 OR pl.unit_price IS NOT NULL)
        ORDER BY h.last_order_at DESC NULLS LAST, v.name
        LIMIT 50
      `);
      return r.rows;
    }, 'DB_ERROR');
  }

  /**
   * One invoice with its PO and GR figures. `purchase_order_id`/`po_id` and
   * `goods_receipt_id`/`gr_id` are historical duplicate columns on
   * `vendor_invoices` — COALESCE covers rows written by either generation.
   */
  async getMatchBasis(invoiceId: number): Promise<Result<VendorInvoiceMatchBasis | null>> {
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        SELECT
          vi.id,
          vi.invoice_number,
          vi.vendor_id,
          vi.created_by,
          vi.status,
          vi.match_status,
          vi.currency,
          COALESCE(vi.purchase_order_id, vi.po_id)          AS po_id,
          COALESCE(vi.goods_receipt_id, vi.gr_id)           AS gr_id,
          COALESCE(vi.total_amount, vi.amount, 0)::numeric  AS invoice_amount,
          COALESCE(vil.invoice_qty, 0)::numeric             AS invoice_qty,
          po.total_amount::numeric                          AS po_amount,
          COALESCE(poi.po_qty, 0)::numeric                  AS po_qty,
          gr.total_value::numeric                           AS gr_amount,
          COALESCE(grl.gr_qty, 0)::numeric                  AS gr_qty,
          COALESCE(pay.paid_amount, 0)::numeric             AS paid_amount
        FROM vendor_invoices vi
        LEFT JOIN purchase_orders po ON po.id = COALESCE(vi.purchase_order_id, vi.po_id)
        LEFT JOIN goods_receipts  gr ON gr.id = COALESCE(vi.goods_receipt_id, vi.gr_id)
        LEFT JOIN LATERAL (
          SELECT SUM(quantity) AS invoice_qty
          FROM vendor_invoice_lines WHERE invoice_id = vi.id
        ) vil ON TRUE
        LEFT JOIN LATERAL (
          SELECT SUM(quantity) AS po_qty
          FROM purchase_order_items WHERE purchase_order_id = po.id
        ) poi ON TRUE
        LEFT JOIN LATERAL (
          SELECT SUM(COALESCE(accepted_quantity, received_quantity, quantity)) AS gr_qty
          FROM goods_receipt_lines
          WHERE COALESCE(goods_receipt_id, receipt_id) = gr.id
        ) grl ON TRUE
        LEFT JOIN LATERAL (
          SELECT SUM(amount) AS paid_amount
          FROM invoice_payments
          WHERE purchase_invoice_id = ${paymentKey(invoiceId)}
            AND COALESCE(status, '') <> 'cancelled'
        ) pay ON TRUE
        WHERE vi.id = ${invoiceId}
        LIMIT 1
      `);
      const row = r.rows[0];
      if (!row) return null;
      return {
        invoiceId: num(row['id']),
        invoiceNumber: String(row['invoice_number'] ?? ''),
        vendorId: numOrNull(row['vendor_id']),
        createdBy: numOrNull(row['created_by']),
        status: String(row['status'] ?? 'pending'),
        matchStatus: String(row['match_status'] ?? 'unmatched'),
        currency: String(row['currency'] ?? 'UZS'),
        poId: numOrNull(row['po_id']),
        grId: numOrNull(row['gr_id']),
        invoiceAmount: num(row['invoice_amount']),
        invoiceQty: num(row['invoice_qty']),
        poAmount: numOrNull(row['po_amount']),
        poQty: num(row['po_qty']),
        grAmount: numOrNull(row['gr_amount']),
        grQty: num(row['gr_qty']),
        paidAmount: num(row['paid_amount']),
      };
    }, 'DB_ERROR');
  }

  /**
   * Status guard lives in the WHERE clause so two concurrent approvals cannot
   * both succeed — the second one matches 0 rows and gets `null` back.
   * Note: the note separator uses `chr(10)`, not `E'\n'` — inside a TS template
   * literal `\n` would already be a real newline and mangle the SQL text.
   */
  async approveInvoice(invoiceId: number, userId: number, notes: string | null): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        UPDATE vendor_invoices
        SET status      = 'approved',
            approved_by = ${userId},
            approved_at = NOW(),
            updated_at  = NOW(),
            notes       = CASE WHEN ${notes}::text IS NULL THEN notes
                               ELSE COALESCE(notes || chr(10), '') || ${notes}::text END
        WHERE id = ${invoiceId}
          AND status IN ('pending', 'matched', 'verified')
        RETURNING *
      `);
      return r.rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async saveMatchOutcome(
    invoiceId: number,
    outcome: MatchOutcomeWrite,
    threeWay: boolean,
  ): Promise<Result<Row | null>> {
    return safeCall(async () => {
      return await db.transaction(async (tx) => {
        const r = await tx.execute(sql`
          UPDATE vendor_invoices
          SET match_status      = ${outcome.matchStatus},
              match_score       = ${outcome.matchScore},
              price_variance    = ${outcome.priceVariance},
              quantity_variance = ${outcome.quantityVariance},
              updated_at        = NOW()
          WHERE id = ${invoiceId}
          RETURNING *
        `);
        const row = (r.rows[0] as Row | undefined) ?? null;
        if (!row) return null;

        // Mirror the verdict onto the PO so the purchasing screens see it.
        // `purchase_orders` is the BASE table behind the `mm_purchase_orders` view.
        const poId = numOrNull(row['purchase_order_id']) ?? numOrNull(row['po_id']);
        if (poId !== null) {
          const matched = outcome.matchStatus === 'matched';
          await tx.execute(
            threeWay
              ? sql`UPDATE purchase_orders
                       SET invoice_matched = ${matched}, three_way_matched = ${matched}, updated_at = NOW()
                     WHERE id = ${poId}`
              : sql`UPDATE purchase_orders
                       SET invoice_matched = ${matched}, updated_at = NOW()
                     WHERE id = ${poId}`,
          );
        }
        return row;
      });
    }, 'DB_ERROR');
  }

  /**
   * Append-only: every match run keeps its own row so the variance history is
   * auditable. (`three_way_match_results.invoice_id` carries no unique index,
   * verified in the live DB — an upsert on it would fail at runtime.)
   */
  async insertThreeWayMatchResult(data: ThreeWayMatchWrite): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        INSERT INTO three_way_match_results (
          invoice_id, purchase_order_id, goods_receipt_id,
          po_total_amount, gr_total_amount, invoice_total_amount,
          price_variance_percent, quantity_variance_percent,
          overall_status, status, tolerance_percent, auto_approved,
          matched_by, matched_at, notes, match_details, created_at
        ) VALUES (
          ${data.invoiceId}, ${data.poId}, ${data.grId},
          ${data.poAmount}, ${data.grAmount}, ${data.invoiceAmount},
          ${data.priceVariancePercent}, ${data.quantityVariancePercent},
          ${data.overallStatus}, ${data.overallStatus}, ${data.tolerancePercent}, ${data.autoApproved},
          ${data.matchedBy}, NOW(), ${data.notes}, ${JSON.stringify(data.matchDetails)}::jsonb, NOW()
        )
        RETURNING *
      `);
      const row = r.rows[0];
      if (!row) throw new Error('three_way_match_results INSERT qator qaytarmadi');
      return row;
    }, 'DB_ERROR');
  }

  /**
   * Money write. Everything happens in ONE transaction behind a per-invoice
   * advisory lock so two concurrent requests cannot produce duplicate payment
   * numbers or a stale invoice status.
   */
  async recordPayment(
    data: VendorInvoicePaymentWrite,
    rule: PaymentStatusRule,
  ): Promise<Result<RecordedPayment>> {
    const key = paymentKey(data.invoiceId);
    try {
      const outcome = await db.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(abs(hashtext(${'mm.vendor_invoice_payment:' + key})))`,
        );

        // Idempotency: the same bank document may not be booked twice.
        if (data.reference) {
          const dup = await tx.execute(sql`
            SELECT id FROM invoice_payments
            WHERE purchase_invoice_id = ${key}
              AND reference = ${data.reference}
              AND COALESCE(status, '') <> 'cancelled'
            LIMIT 1
          `);
          if (dup.rows[0]) {
            return Err<RecordedPayment>(
              AppErr('CONFLICT', `Bu havola bilan to'lov allaqachon qayd etilgan: ${data.reference}`),
            );
          }
        }

        const seqRes = await tx.execute(sql`
          SELECT (COUNT(*) + 1)::int AS seq
          FROM invoice_payments WHERE purchase_invoice_id = ${key}
        `);
        const seq = num((seqRes.rows[0] as { seq?: number } | undefined)?.seq, 1);
        const paymentNumber = `VIP-${data.invoiceId}-${String(seq).padStart(3, '0')}`;

        const ins = await tx.execute(sql`
          INSERT INTO invoice_payments (
            payment_number, payment_date, purchase_invoice_id, vendor_id,
            payment_method, amount, currency, exchange_rate,
            reference, bank_account, status, notes, created_by, created_at
          ) VALUES (
            ${paymentNumber}, ${data.paymentDate}, ${key}, ${data.vendorId},
            ${data.paymentMethod}, ${data.amount}, ${data.currency}, ${data.exchangeRate},
            ${data.reference}, ${data.bankAccount}, 'posted', ${data.notes}, ${data.createdBy}, NOW()
          )
          RETURNING *
        `);
        const payment = (ins.rows[0] as Row | undefined) ?? null;
        if (!payment) return Err<RecordedPayment>(AppErr('DB_ERROR', "To'lov yozuvi saqlanmadi"));

        const totRes = await tx.execute(sql`
          SELECT COALESCE(SUM(amount), 0)::numeric AS paid_total
          FROM invoice_payments
          WHERE purchase_invoice_id = ${key}
            AND COALESCE(status, '') <> 'cancelled'
        `);
        const paidTotal = num((totRes.rows[0] as Row | undefined)?.['paid_total']);
        const invoiceStatus =
          paidTotal >= rule.fullyPaidAtOrAbove ? rule.statusWhenFullyPaid : rule.statusWhenPartial;

        await tx.execute(sql`
          UPDATE vendor_invoices
          SET status = ${invoiceStatus}, updated_at = NOW()
          WHERE id = ${data.invoiceId}
        `);

        return Ok<RecordedPayment>({ payment, paidTotal, invoiceStatus });
      });
      return outcome;
    } catch (e: unknown) {
      this.logger.error(`recordPayment failed for invoice ${data.invoiceId}`);
      return Err(AppErr('DB_ERROR', (e as Error)?.message ?? "To'lovni qayd etishda xatolik"));
    }
  }
}
