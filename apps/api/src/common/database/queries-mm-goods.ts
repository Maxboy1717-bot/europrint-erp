/**
 * @module queries-mm-goods
 * @description Source module. See exports for details.
 *
 * NOTE: mm_goods_receipts_ext / mm_goods_issues_ext re-export the canonical
 * `mm_goods_receipts` / `mm_goods_issues` from schema-business-b-1.ts, whose
 * column shape (po_id, no delivery_note, no updated_at, issued_to, etc.) differs
 * from the extended shape this module expects (purchase_order_id, delivery_note,
 * updated_at, issued_by, cost_center, work_order_id). Affected functions use raw
 * SQL while the duplicate schemas remain unreconciled.
 * TODO PA-SCHEMA: unify mm_goods_receipts/issues duplicates.
 */

import { db } from '@shared/db';
import { typedExecute } from '@shared/db/typed-execute';
import {
  mm_goods_receipts_ext, mm_goods_receipt_items,
  mm_goods_issues_ext, mm_goods_issue_items,
  mm_purchase_orders, mm_purchase_order_items,
  mm_vendors_ext, mm_materials_ext, finance_invoices, currencies,
} from '@shared/db';
import { eq, and, sql, desc } from 'drizzle-orm';
import { MM_THREE_WAY_MATCH_TOLERANCE } from '@common/constants/business.constants';

type Row = Record<string, unknown>;

export async function queryGoodsReceipts(pid: number | null, status: string | undefined, lim: number, off: number): Promise<Row[]> {
  // mm_goods_receipts (VIEW over goods_receipts) has NO delivery_note / updated_at column
  // (see module header). Select only real columns; delivery_note is folded into notes on create.
  const rows = await typedExecute<Row>(sql`
    SELECT
      gr.id,
      gr.purchase_order_id,
      gr.received_by,
      gr.notes,
      gr.status,
      gr.created_at,
      'PO-' || po.id AS po_number,
      v.name AS vendor_name
    FROM mm_goods_receipts gr
    LEFT JOIN mm_purchase_orders po ON po.id = gr.purchase_order_id
    LEFT JOIN mm_vendors v ON v.id = po.vendor_id
    WHERE ${pid !== null ? sql`gr.purchase_order_id = ${pid}` : sql`TRUE`}
      AND ${status ? sql`gr.status = ${status}` : sql`TRUE`}
    ORDER BY gr.created_at DESC
    LIMIT ${lim} OFFSET ${off}
  `);
  return rows;
}

export async function queryGoodsReceipt(gid: number): Promise<{ receipt: Row | null; items: Row[] }> {
  const receiptRowsRaw = await typedExecute<Row>(sql`
    SELECT
      gr.id,
      gr.purchase_order_id,
      gr.received_by,
      gr.notes,
      gr.status,
      gr.created_at,
      'PO-' || po.id AS po_number,
      v.name AS vendor_name
    FROM mm_goods_receipts gr
    LEFT JOIN mm_purchase_orders po ON po.id = gr.purchase_order_id
    LEFT JOIN mm_vendors v ON v.id = po.vendor_id
    WHERE gr.id = ${gid}
  `);
  const receiptRows = receiptRowsRaw;
  if (!receiptRows.length) return { receipt: null, items: [] };

  const itemRows = await db.select({
    id:              mm_goods_receipt_items.id,
    receipt_id:      mm_goods_receipt_items.receipt_id,
    material_id:     mm_goods_receipt_items.material_id,
    ordered_qty:     mm_goods_receipt_items.ordered_qty,
    received_qty:    mm_goods_receipt_items.received_qty,
    batch_number:    mm_goods_receipt_items.batch_number,
    material_name:   mm_materials_ext.name,
    unit_of_measure: mm_materials_ext.unit_of_measure,
  })
    .from(mm_goods_receipt_items)
    .leftJoin(mm_materials_ext, eq(mm_materials_ext.id, mm_goods_receipt_items.material_id))
    .where(eq(mm_goods_receipt_items.receipt_id, gid));
  return { receipt: receiptRows[0] as Row, items: itemRows as Row[] };
}

export async function execCreateGoodsReceipt(purchase_order_id: unknown, received_by: unknown, notes: unknown, delivery_note: unknown, warehouse_id?: unknown): Promise<Row> {
  // mm_goods_receipts is a VIEW over goods_receipts — insert into the BASE table with its NOT NULL
  // columns (receipt_number, receipt_date). The view/base have no delivery_note or updated_at column,
  // so delivery_note is folded into notes. received_by is INTEGER (the DTO sends a string) -> coerce.
  const rb = received_by != null && String(received_by).trim() !== '' && Number.isFinite(Number(received_by)) ? Number(received_by) : null;
  const note = [notes, delivery_note].filter(Boolean).join(' | ') || null;
  const rowsRaw = await typedExecute<Row>(sql`
    INSERT INTO goods_receipts (receipt_number, receipt_date, purchase_order_id, received_by, notes, warehouse_id, status)
    VALUES (
      'GR-' || (extract(epoch from now())::bigint)::text,
      to_char(NOW(), 'YYYY-MM-DD'),
      ${(purchase_order_id as number | null) ?? null},
      ${rb},
      ${note},
      ${(warehouse_id as number | null) ?? null},
      'pending'
    )
    RETURNING *
  `);
  return (rowsRaw[0] ?? {}) as Row;
}

/**
 * #09 xarid->kirim: post a goods receipt into the CANONICAL warehouse_stock. Sums received_qty per
 * material for the receipt's warehouse and upserts on (warehouse_id, material_id) — same proven
 * pattern as execReceiveFg. Reads the BASE goods_receipt_items (gr_id/raw_material_id, received_qty is
 * numeric). GROUP BY collapses duplicate-material lines so ON CONFLICT never updates one row twice.
 * Returns the number of (material) rows posted (0 if no warehouse_id or nothing received).
 */
export async function execPostGoodsReceiptStock(receiptId: number): Promise<number> {
  const r = await typedExecute<Row>(sql`
    INSERT INTO warehouse_stock
      (warehouse_id, material_id, quantity, reserved_quantity, available_quantity, last_updated_at, created_at, last_movement_at)
    SELECT gr.warehouse_id, i.raw_material_id, SUM(i.received_qty), 0, SUM(i.received_qty), NOW(), NOW(), NOW()
    FROM goods_receipt_items i
    JOIN goods_receipts gr ON gr.id = i.gr_id
    WHERE i.gr_id = ${receiptId} AND gr.warehouse_id IS NOT NULL AND i.received_qty > 0
    GROUP BY gr.warehouse_id, i.raw_material_id
    ON CONFLICT (warehouse_id, material_id) DO UPDATE SET
      quantity           = warehouse_stock.quantity + EXCLUDED.quantity,
      available_quantity = warehouse_stock.available_quantity + EXCLUDED.available_quantity,
      last_movement_at   = NOW(),
      last_updated_at    = NOW()
    RETURNING material_id
  `);
  return Array.isArray(r) ? r.length : 0;
}

export async function execInsertGoodsReceiptItem(receiptId: unknown, material_id: unknown, ordered_qty: unknown, received_qty: unknown, batch_number: unknown, unit?: unknown): Promise<void> {
  // Base goods_receipt_items: gr_id/raw_material_id, numeric ordered_qty/received_qty, NOT NULL unit.
  await typedExecute<Row>(sql`
    INSERT INTO goods_receipt_items (gr_id, raw_material_id, ordered_qty, received_qty, unit, batch_number)
    VALUES (${receiptId as number}, ${material_id as number}, ${Number(ordered_qty ?? 0)}, ${Number(received_qty ?? 0)},
      ${(unit as string | null) ?? 'dona'}, ${(batch_number as string | null) ?? null})
  `);
}

export async function execUpdateGoodsReceipt(gid: number, status: unknown, notes: unknown): Promise<Row[]> {
  // Base goods_receipts (mm_goods_receipts is a VIEW over it) has no updated_at column.
  const rowsRaw = await typedExecute<Row>(sql`
    UPDATE goods_receipts
    SET status = COALESCE(${status ?? null}, status),
        notes = COALESCE(${notes ?? null}, notes)
    WHERE id = ${gid}
    RETURNING *
  `);
  return rowsRaw;
}

export async function execDeleteGoodsReceipt(gid: number): Promise<void> {
  await db.delete(mm_goods_receipts_ext).where(eq(mm_goods_receipts_ext.id, gid));
}

export async function queryGoodsIssues(status: string | undefined, lim: number, off: number): Promise<Row[]> {
  // mm_goods_issues (VIEW over goods_issues) exposes: id, gi_number, issue_date, issue_type,
  // reference_id, warehouse_id, issued_by, issued_to, status, notes, created_at. It has NO
  // cost_center / work_order_id column — select only real columns and surface those two FE/DTO
  // keys as NULL (no invented values). work_order_id, when stored on create, lives in reference_id.
  const rowsRaw = await typedExecute<Row>(sql`
    SELECT
      id, gi_number, issue_date, issue_type, reference_id, warehouse_id,
      issued_by, issued_to, notes, status, created_at,
      NULL::text AS cost_center,
      NULL::integer AS work_order_id,
      (SELECT full_name FROM employees WHERE id = issued_by LIMIT 1) AS issued_by_name
    FROM mm_goods_issues
    WHERE ${status ? sql`status = ${status}` : sql`TRUE`}
    ORDER BY created_at DESC
    LIMIT ${lim} OFFSET ${off}
  `);
  return rowsRaw;
}

export async function queryGoodsIssue(gid: number): Promise<{ issue: Row | null; items: Row[] }> {
  // mm_goods_issues VIEW has no cost_center / work_order_id column — select real columns and surface
  // those two FE/DTO keys as NULL (see queryGoodsIssues). work_order_id (on create) lives in reference_id.
  const issueRowsRaw = await typedExecute<Row>(sql`
    SELECT
      id, gi_number, issue_date, issue_type, reference_id, warehouse_id,
      issued_by, issued_to, notes, status, created_at,
      NULL::text AS cost_center,
      NULL::integer AS work_order_id,
      (SELECT full_name FROM employees WHERE id = issued_by LIMIT 1) AS issued_by_name
    FROM mm_goods_issues
    WHERE id = ${gid}
  `);
  const issueRows = issueRowsRaw;
  if (!issueRows.length) return { issue: null, items: [] };

  const itemRows = await db.select({
    id:              mm_goods_issue_items.id,
    issue_id:        mm_goods_issue_items.issue_id,
    material_id:     mm_goods_issue_items.material_id,
    quantity:        mm_goods_issue_items.quantity,
    batch_number:    mm_goods_issue_items.batch_number,
    material_name:   mm_materials_ext.name,
    unit_of_measure: mm_materials_ext.unit_of_measure,
  })
    .from(mm_goods_issue_items)
    .leftJoin(mm_materials_ext, eq(mm_materials_ext.id, mm_goods_issue_items.material_id))
    .where(eq(mm_goods_issue_items.issue_id, gid));
  return { issue: issueRows[0] as Row, items: itemRows as Row[] };
}

export async function execCreateGoodsIssue(issued_by: unknown, cost_center: unknown, work_order_id: unknown, notes: unknown, warehouse_id?: unknown): Promise<Row> {
  // mm_goods_issues is a VIEW over goods_issues — insert into the BASE table using its REAL columns.
  // The base table has NO cost_center / work_order_id column. Required NOT NULL columns: gi_number,
  // issue_date, issue_type, warehouse_id (generate gi_number/issue_date deterministically, mirror the
  // goods-receipt pattern). work_order_id is stored in reference_id (the real "what this issue
  // references" column, text). cost_center has no column, so it is folded into notes (no data dropped,
  // no invented values). issued_by is INTEGER -> coerce.
  const ib = issued_by != null && String(issued_by).trim() !== '' && Number.isFinite(Number(issued_by)) ? Number(issued_by) : null;
  const note = [notes, cost_center != null && String(cost_center).trim() !== '' ? `cost_center: ${cost_center}` : null].filter(Boolean).join(' | ') || null;
  const refId = work_order_id != null && String(work_order_id).trim() !== '' ? String(work_order_id) : null;
  const rowsRaw = await typedExecute<Row>(sql`
    INSERT INTO goods_issues (gi_number, issue_date, issue_type, reference_id, warehouse_id, issued_by, notes, status)
    VALUES (
      'GI-' || (extract(epoch from now())::bigint)::text,
      to_char(NOW(), 'YYYY-MM-DD'),
      'production',
      ${refId},
      ${(warehouse_id as number | null) ?? null},
      ${ib},
      ${note},
      'pending'
    )
    RETURNING *
  `);
  const rows = rowsRaw;
  return (rows[0] ?? {}) as Row;
}

export async function execInsertGoodsIssueItem(issueId: unknown, material_id: unknown, quantity: unknown, batch_number: unknown): Promise<void> {
  await db.insert(mm_goods_issue_items).values({
    issue_id: issueId as number,
    material_id: material_id as number,
    quantity: String(quantity),
    batch_number: batch_number as string | null,
  });
}

export async function execUpdateGoodsIssue(gid: number, status: unknown, notes: unknown): Promise<Row[]> {
  const rowsRaw = await typedExecute<Row>(sql`
    UPDATE mm_goods_issues
    SET status = COALESCE(${status ?? null}, status),
        notes = COALESCE(${notes ?? null}, notes),
        updated_at = NOW()
    WHERE id = ${gid}
    RETURNING *
  `);
  return rowsRaw;
}

export async function execDeleteGoodsIssue(gid: number): Promise<void> {
  await db.delete(mm_goods_issues_ext).where(eq(mm_goods_issues_ext.id, gid));
}

/**
 * SB0547 3-way match: PO <-> Receipt <-> Invoice.
 * Beyond returning the three raw documents, this now actually COMPUTES the match —
 * PO total vs. goods-receipt total (real received value, from receipt items x PO
 * line unit_price when the receipt itself carries no total) vs. invoice total —
 * using the same tolerance/variance logic already proven in
 * drizzle-mm.repo.ts#validateThreeWayMatch (called from GoodsReceiptHandler at
 * receipt time). That method only returns {matched, difference} for the write path;
 * this read endpoint mirrors the computation so `GET /mm/three-way-match/:poId`
 * (used for manual review / HITL) shows real matched/variance state instead of only
 * raw joined rows the caller had to diff by hand.
 */
export async function queryThreeWayMatch(pid: number): Promise<{
  purchase_order: unknown; goods_receipts: Row[]; purchase_invoices: Row[];
  match: { matched: boolean; difference: number; tolerance_pct: number; po_total: number; goods_receipt_total: number; invoice_total: number; documents_present: boolean } | null;
}> {
  const [poRow] = await db.select().from(mm_purchase_orders).where(eq(mm_purchase_orders.id, pid)).limit(1);
  const receiptsRaw = await typedExecute<Row>(sql`SELECT * FROM mm_goods_receipts WHERE purchase_order_id = ${pid}`);
  const receipts = receiptsRaw;
  // finance_invoices (invoice_type='purchase') = kanonik AP invoice-manba, OWNER QARORI
  // 2026-07-02 (purchase_invoices endi yozuvchisiz — commit d6286993).
  const invoices = poRow?.vendor_id
    ? await db.select().from(finance_invoices).where(and(
        eq(finance_invoices.invoice_type, 'purchase'),
        eq(finance_invoices.vendor_id, poRow.vendor_id),
      ))
    : [];

  let match: { matched: boolean; difference: number; tolerance_pct: number; po_total: number; goods_receipt_total: number; invoice_total: number; documents_present: boolean } | null = null;
  if (poRow) {
    const amtRows = await typedExecute<{ po_total: number | string | null; gr_total: number | string | null; invoice_total: number | string | null }>(sql`
      SELECT
        po.total_amount AS po_total,
        COALESCE(gr.total_value, gri.computed_value, 0) AS gr_total,
        COALESCE(inv.invoice_total, 0) AS invoice_total
      FROM purchase_orders po
      LEFT JOIN LATERAL (
        SELECT g.id, g.total_value
        FROM mm_goods_receipts g
        WHERE g.purchase_order_id = po.id
        ORDER BY g.id DESC
        LIMIT 1
      ) gr ON TRUE
      LEFT JOIN LATERAL (
        SELECT SUM(it.received_qty * COALESCE(poi.unit_price, 0)) AS computed_value
        FROM mm_goods_receipts g2
        JOIN mm_goods_receipt_items it ON it.gr_id = g2.id
        LEFT JOIN purchase_order_items poi
          ON poi.purchase_order_id = po.id
         AND poi.raw_material_id = it.raw_material_id
        WHERE g2.purchase_order_id = po.id
      ) gri ON TRUE
      LEFT JOIN LATERAL (
        SELECT SUM(COALESCE(pi.total_amount, 0)) AS invoice_total
        FROM finance_invoices pi
        WHERE pi.invoice_type = 'purchase' AND pi.vendor_id = po.vendor_id
      ) inv ON TRUE
      WHERE po.id = ${pid}
      LIMIT 1
    `);
    const amtRow = amtRows[0];
    if (amtRow) {
      const poTotal = Number(amtRow.po_total ?? 0);
      const grTotal = Number(amtRow.gr_total ?? 0);
      const invoiceTotal = Number(amtRow.invoice_total ?? 0);
      const amounts = [poTotal, grTotal, invoiceTotal];
      const difference = Math.max(...amounts) - Math.min(...amounts);
      const toleranceAbs = Math.max(Math.abs(poTotal) * MM_THREE_WAY_MATCH_TOLERANCE, 1);
      const documentsPresent = grTotal > 0 && invoiceTotal > 0;
      match = {
        matched: documentsPresent && difference <= toleranceAbs,
        difference: Math.round(difference),
        tolerance_pct: MM_THREE_WAY_MATCH_TOLERANCE,
        po_total: poTotal,
        goods_receipt_total: grTotal,
        invoice_total: invoiceTotal,
        documents_present: documentsPresent,
      };
    }
  }

  return { purchase_order: poRow ?? null, goods_receipts: receipts, purchase_invoices: invoices as Row[], match };
}

export async function queryCurrencies(): Promise<Row[]> {
  const rows = await db.select().from(currencies).orderBy(currencies.code);
  return rows as Row[];
}

export async function queryPriceComparison(mid: number | null): Promise<Row[]> {
  const rows = await db.select({
    material_id:  mm_purchase_order_items.material_id,
    material_name: mm_materials_ext.name,
    vendor_name:  mm_vendors_ext.name,
    unit_price:   mm_purchase_order_items.unit_price,
    currency:     sql<string>`${mm_purchase_orders.currency}`,
    created_at:   mm_purchase_orders.created_at,
  })
    .from(mm_purchase_order_items)
    .leftJoin(mm_purchase_orders, eq(mm_purchase_orders.id, mm_purchase_order_items.purchase_order_id))
    .leftJoin(mm_vendors_ext, eq(mm_vendors_ext.id, sql`${mm_purchase_orders.vendor_id}`))
    .leftJoin(mm_materials_ext, eq(mm_materials_ext.id, mm_purchase_order_items.material_id))
    .where(mid !== null ? eq(mm_purchase_order_items.material_id, mid) : sql`TRUE`)
    .orderBy(mm_purchase_order_items.material_id, mm_purchase_order_items.unit_price);
  return rows as Row[];
}
