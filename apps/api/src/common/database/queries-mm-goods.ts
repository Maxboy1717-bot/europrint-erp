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
  mm_vendors_ext, mm_materials_ext, purchase_invoices, currencies,
} from '@shared/db';
import { eq, sql, desc } from 'drizzle-orm';

type Row = Record<string, unknown>;

export async function queryGoodsReceipts(pid: number | null, status: string | undefined, lim: number, off: number): Promise<Row[]> {
  const rows = await typedExecute<Row>(sql`
    SELECT
      gr.id,
      gr.purchase_order_id,
      gr.received_by,
      gr.notes,
      gr.delivery_note,
      gr.status,
      gr.created_at,
      gr.updated_at,
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
      gr.delivery_note,
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

export async function execCreateGoodsReceipt(purchase_order_id: unknown, received_by: unknown, notes: unknown, delivery_note: unknown): Promise<Row> {
  const rowsRaw = await typedExecute<Row>(sql`
    INSERT INTO mm_goods_receipts (purchase_order_id, received_by, notes, delivery_note, status)
    VALUES (${purchase_order_id as number}, ${(received_by as number | null) ?? null},
      ${(notes as string | null) ?? null}, ${(delivery_note as string | null) ?? null}, 'pending')
    RETURNING *
  `);
  const rows = rowsRaw;
  return (rows[0] ?? {}) as Row;
}

export async function execInsertGoodsReceiptItem(receiptId: unknown, material_id: unknown, ordered_qty: unknown, received_qty: unknown, batch_number: unknown): Promise<void> {
  await db.insert(mm_goods_receipt_items).values({
    receipt_id: receiptId as number,
    material_id: material_id as number,
    ordered_qty: String(ordered_qty ?? 0),
    received_qty: String(received_qty ?? 0),
    batch_number: batch_number as string | null,
  });
}

export async function execUpdateGoodsReceipt(gid: number, status: unknown, notes: unknown): Promise<Row[]> {
  const rowsRaw = await typedExecute<Row>(sql`
    UPDATE mm_goods_receipts
    SET status = COALESCE(${status ?? null}, status),
        notes = COALESCE(${notes ?? null}, notes),
        updated_at = NOW()
    WHERE id = ${gid}
    RETURNING *
  `);
  return rowsRaw;
}

export async function execDeleteGoodsReceipt(gid: number): Promise<void> {
  await db.delete(mm_goods_receipts_ext).where(eq(mm_goods_receipts_ext.id, gid));
}

export async function queryGoodsIssues(status: string | undefined, lim: number, off: number): Promise<Row[]> {
  const rowsRaw = await typedExecute<Row>(sql`
    SELECT
      id, issued_by, cost_center, work_order_id, notes, status, created_at,
      (SELECT full_name FROM employees WHERE id = issued_by LIMIT 1) AS issued_by_name
    FROM mm_goods_issues
    WHERE ${status ? sql`status = ${status}` : sql`TRUE`}
    ORDER BY created_at DESC
    LIMIT ${lim} OFFSET ${off}
  `);
  return rowsRaw;
}

export async function queryGoodsIssue(gid: number): Promise<{ issue: Row | null; items: Row[] }> {
  const issueRowsRaw = await typedExecute<Row>(sql`
    SELECT
      id, issued_by, cost_center, work_order_id, notes, status, created_at,
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

export async function execCreateGoodsIssue(issued_by: unknown, cost_center: unknown, work_order_id: unknown, notes: unknown): Promise<Row> {
  const rowsRaw = await typedExecute<Row>(sql`
    INSERT INTO mm_goods_issues (issued_by, cost_center, work_order_id, notes, status)
    VALUES (${(issued_by as number | null) ?? null}, ${(cost_center as string | null) ?? null},
      ${(work_order_id as number | null) ?? null}, ${(notes as string | null) ?? null}, 'pending')
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

export async function queryThreeWayMatch(pid: number): Promise<{ purchase_order: unknown; goods_receipts: Row[]; purchase_invoices: Row[] }> {
  const [poRow] = await db.select().from(mm_purchase_orders).where(eq(mm_purchase_orders.id, pid)).limit(1);
  const receiptsRaw = await typedExecute<Row>(sql`SELECT * FROM mm_goods_receipts WHERE purchase_order_id = ${pid}`);
  const receipts = receiptsRaw;
  const invoices = poRow?.vendor_id
    ? await db.select().from(purchase_invoices).where(eq(purchase_invoices.vendor_id, poRow.vendor_id))
    : [];
  return { purchase_order: poRow ?? null, goods_receipts: receipts, purchase_invoices: invoices as Row[] };
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
