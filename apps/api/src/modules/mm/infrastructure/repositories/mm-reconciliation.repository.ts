/**
 * @module mm-reconciliation.repository
 * @description Data-access for vendor reconciliation (sverka akti). Wraps raw SQL
 *   (multi-subquery aggregate + FULL OUTER JOIN CTE digest) via runQuery; returns
 *   Result<T>. gl_entries has no vendor dimension, so finance_invoices is the AP
 *   ledger source (invoice_type='purchase'); goods-received side is mm_goods_receipts,
 *   matched to a vendor via COALESCE(po.vendor_id, gr.supplier_id). vendors is the
 *   canonical vendor table (same one drizzle-mm.repo reads).
 * @layer Infrastructure (MM)
 */

import { Ok, Err, Result, AppErr } from '@common/result';
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import type {
  IMmReconciliationRepo,
  VendorReconciliationRow,
  DiscrepancyDigestRow,
} from '../../domain/repositories/i-mm-reconciliation.repo';

@Injectable()
export class MmReconciliationRepository implements IMmReconciliationRepo {
  async getVendorReconciliation(
    vendorId: number,
    fromDate: string,
    toDate: string,
  ): Promise<Result<VendorReconciliationRow | null>> {
    try {
      const rows = await runQuery<VendorReconciliationRow>(sql`
        SELECT
          (SELECT COALESCE(SUM(COALESCE(total_amount,0) - COALESCE(paid_amount,0)),0)
             FROM finance_invoices
            WHERE vendor_id = ${vendorId} AND invoice_type = 'purchase'
              AND created_at < ${fromDate}::timestamp) AS opening,
          (SELECT COALESCE(SUM(COALESCE(total_amount,0)),0)
             FROM finance_invoices
            WHERE vendor_id = ${vendorId} AND invoice_type = 'purchase'
              AND created_at >= ${fromDate}::timestamp
              AND created_at < (${toDate}::date + 1)::timestamp) AS invoiced,
          (SELECT COALESCE(SUM(COALESCE(paid_amount,0)),0)
             FROM finance_invoices
            WHERE vendor_id = ${vendorId} AND invoice_type = 'purchase'
              AND created_at >= ${fromDate}::timestamp
              AND created_at < (${toDate}::date + 1)::timestamp) AS payments,
          (SELECT COALESCE(SUM(COALESCE(gr.total_value,0)),0)
             FROM mm_goods_receipts gr
             LEFT JOIN mm_purchase_orders po ON po.id = gr.purchase_order_id
            WHERE COALESCE(po.vendor_id, gr.supplier_id) = ${vendorId}
              AND gr.created_at >= ${fromDate}::timestamp
              AND gr.created_at < (${toDate}::date + 1)::timestamp) AS receipts,
          (SELECT name FROM vendors WHERE id = ${vendorId}) AS vendor_name
      `);
      return Ok((rows.rows[0] ?? null) as VendorReconciliationRow | null);
    } catch (e) {
      return Err(AppErr('DB_ERROR', `MM_RECON_VENDOR_FAILED: ${String(e)}`));
    }
  }

  async getDiscrepancyDigest(
    fromDate: string,
    toDate: string,
    epsilon: number,
  ): Promise<Result<DiscrepancyDigestRow[]>> {
    try {
      const rows = await runQuery<DiscrepancyDigestRow>(sql`
        WITH inv AS (
          SELECT vendor_id AS vid, SUM(COALESCE(total_amount,0)) AS invoiced
            FROM finance_invoices
           WHERE invoice_type = 'purchase' AND vendor_id IS NOT NULL
             AND created_at >= ${fromDate}::timestamp
             AND created_at < (${toDate}::date + 1)::timestamp
           GROUP BY vendor_id
        ),
        rec AS (
          SELECT COALESCE(po.vendor_id, gr.supplier_id) AS vid,
                 SUM(COALESCE(gr.total_value,0)) AS receipts
            FROM mm_goods_receipts gr
            LEFT JOIN mm_purchase_orders po ON po.id = gr.purchase_order_id
           WHERE gr.created_at >= ${fromDate}::timestamp
             AND gr.created_at < (${toDate}::date + 1)::timestamp
             AND COALESCE(po.vendor_id, gr.supplier_id) IS NOT NULL
           GROUP BY COALESCE(po.vendor_id, gr.supplier_id)
        )
        SELECT COALESCE(inv.vid, rec.vid) AS vendor_id,
               v.name AS vendor_name,
               COALESCE(inv.invoiced,0) AS invoiced,
               COALESCE(rec.receipts,0) AS receipts,
               ROUND(COALESCE(inv.invoiced,0) - COALESCE(rec.receipts,0), 2) AS discrepancy
          FROM inv FULL OUTER JOIN rec ON inv.vid = rec.vid
          LEFT JOIN vendors v ON v.id = COALESCE(inv.vid, rec.vid)
         WHERE ABS(ROUND(COALESCE(inv.invoiced,0) - COALESCE(rec.receipts,0), 2)) >= ${epsilon}
         ORDER BY ABS(ROUND(COALESCE(inv.invoiced,0) - COALESCE(rec.receipts,0), 2)) DESC
      `);
      return Ok(rows.rows as DiscrepancyDigestRow[]);
    } catch (e) {
      return Err(AppErr('DB_ERROR', `MM_RECON_DIGEST_FAILED: ${String(e)}`));
    }
  }

  async findUserIdsByRoles(roles: string[]): Promise<Result<number[]>> {
    try {
      const rows = await runQuery<{ id: number }>(sql`
        SELECT id FROM users
         WHERE role = ANY(${roles}::text[])
           AND is_active = TRUE AND deleted_at IS NULL
         LIMIT 200
      `);
      return Ok((Array.isArray(rows.rows) ? rows.rows : []).map((r) => Number(r.id)).filter(Boolean));
    } catch (e) {
      return Err(AppErr('DB_ERROR', `MM_RECON_ROLE_USERS_FAILED: ${String(e)}`));
    }
  }
}
