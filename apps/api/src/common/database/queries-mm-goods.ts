import { db } from '@shared/db';
import {
  mm_goods_receipts_ext, mm_goods_receipt_items,
  mm_goods_issues_ext, mm_goods_issue_items,
  mm_purchase_orders, mm_purchase_order_items,
  mm_vendors_ext, mm_materials_ext, purchase_invoices, currencies,
} from '@shared/db';
import { eq, and, sql, desc, isNull } from 'drizzle-orm';

type Row = Record<string, unknown>;

export async function queryGoodsReceipts(pid: number | null, status: string | undefined, lim: number, off: number): Promise<Row[]> {
  const rows = await db.select({
    id:          mm_goods_receipts_ext.id,
    purchase_order_id: mm_goods_receipts_ext.purchase_order_id,
    received_by: mm_goods_receipts_ext.received_by,
    notes:       mm_goods_receipts_ext.notes,
    delivery_note: mm_goods_receipts_ext.delivery_note,
    status:      mm_goods_receipts_ext.status,
    created_at:  mm_goods_receipts_ext.created_at,
    updated_at:  mm_goods_receipts_ext.updated_at,
    po_number:   sql<string>`'PO-' || ${mm_purchase_orders.id}`,
    vendor_name: sql<string>`${mm_vendors_ext.name}`,
  })
    .from(mm_goods_receipts_ext)
    .leftJoin(mm_purchase_orders, eq(mm_purchase_orders.id, mm_goods_receipts_ext.purchase_order_id))
    .leftJoin(mm_vendors_ext, eq(mm_vendors_ext.id, sql`${mm_purchase_orders.vendor_id}`))
    .where(and(
      pid !== null ? eq(mm_goods_receipts_ext.purchase_order_id, pid) : sql`TRUE`,
      status ? eq(mm_goods_receipts_ext.status, status) : sql`TRUE`,
    ))
    .orderBy(desc(mm_goods_receipts_ext.created_at))
    .limit(lim)
    .offset(off);
  return rows as Row[];
}

export async function queryGoodsReceipt(gid: number): Promise<{ receipt: Row | null; items: Row[] }> {
  const receiptRows = await db.select({
    id:          mm_goods_receipts_ext.id,
    purchase_order_id: mm_goods_receipts_ext.purchase_order_id,
    received_by: mm_goods_receipts_ext.received_by,
    notes:       mm_goods_receipts_ext.notes,
    delivery_note: mm_goods_receipts_ext.delivery_note,
    status:      mm_goods_receipts_ext.status,
    created_at:  mm_goods_receipts_ext.created_at,
    po_number:   sql<string>`'PO-' || ${mm_purchase_orders.id}`,
    vendor_name: sql<string>`${mm_vendors_ext.name}`,
  })
    .from(mm_goods_receipts_ext)
    .leftJoin(mm_purchase_orders, eq(mm_purchase_orders.id, mm_goods_receipts_ext.purchase_order_id))
    .leftJoin(mm_vendors_ext, eq(mm_vendors_ext.id, sql`${mm_purchase_orders.vendor_id}`))
    .where(eq(mm_goods_receipts_ext.id, gid));
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
  const rows = await db.insert(mm_goods_receipts_ext).values({
    purchase_order_id: purchase_order_id as number,
    received_by: received_by as number | null,
    notes: notes as string | null,
    delivery_note: delivery_note as string | null,
    status: 'pending',
  }).returning();
  return rows[0] as Row;
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
  const rows = await db.update(mm_goods_receipts_ext)
    .set({
      status: sql`COALESCE(${status ?? null}, ${mm_goods_receipts_ext.status})`,
      notes: sql`COALESCE(${notes ?? null}, ${mm_goods_receipts_ext.notes})`,
      updated_at: sql`NOW()`,
    })
    .where(eq(mm_goods_receipts_ext.id, gid))
    .returning();
  return rows as Row[];
}

export async function execDeleteGoodsReceipt(gid: number): Promise<void> {
  await db.delete(mm_goods_receipts_ext).where(eq(mm_goods_receipts_ext.id, gid));
}

export async function queryGoodsIssues(status: string | undefined, lim: number, off: number): Promise<Row[]> {
  const rows = await db.select({
    id:          mm_goods_issues_ext.id,
    issued_by:   mm_goods_issues_ext.issued_by,
    cost_center: mm_goods_issues_ext.cost_center,
    work_order_id: mm_goods_issues_ext.work_order_id,
    notes:       mm_goods_issues_ext.notes,
    status:      mm_goods_issues_ext.status,
    created_at:  mm_goods_issues_ext.created_at,
    issued_by_name: sql<string>`(SELECT full_name FROM employees WHERE id = ${mm_goods_issues_ext.issued_by} LIMIT 1)`,
  })
    .from(mm_goods_issues_ext)
    .where(status ? eq(mm_goods_issues_ext.status, status) : sql`TRUE`)
    .orderBy(desc(mm_goods_issues_ext.created_at))
    .limit(lim)
    .offset(off);
  return rows as Row[];
}

export async function queryGoodsIssue(gid: number): Promise<{ issue: Row | null; items: Row[] }> {
  const issueRows = await db.select({
    id:          mm_goods_issues_ext.id,
    issued_by:   mm_goods_issues_ext.issued_by,
    cost_center: mm_goods_issues_ext.cost_center,
    work_order_id: mm_goods_issues_ext.work_order_id,
    notes:       mm_goods_issues_ext.notes,
    status:      mm_goods_issues_ext.status,
    created_at:  mm_goods_issues_ext.created_at,
    issued_by_name: sql<string>`(SELECT full_name FROM employees WHERE id = ${mm_goods_issues_ext.issued_by} LIMIT 1)`,
  })
    .from(mm_goods_issues_ext)
    .where(eq(mm_goods_issues_ext.id, gid));
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
  const rows = await db.insert(mm_goods_issues_ext).values({
    issued_by: issued_by as number | null,
    cost_center: cost_center as string | null,
    work_order_id: work_order_id as number | null,
    notes: notes as string | null,
    status: 'pending',
  }).returning();
  return rows[0] as Row;
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
  const rows = await db.update(mm_goods_issues_ext)
    .set({
      status: sql`COALESCE(${status ?? null}, ${mm_goods_issues_ext.status})`,
      notes: sql`COALESCE(${notes ?? null}, ${mm_goods_issues_ext.notes})`,
      updated_at: sql`NOW()`,
    })
    .where(eq(mm_goods_issues_ext.id, gid))
    .returning();
  return rows as Row[];
}

export async function execDeleteGoodsIssue(gid: number): Promise<void> {
  await db.delete(mm_goods_issues_ext).where(eq(mm_goods_issues_ext.id, gid));
}

export async function queryThreeWayMatch(pid: number): Promise<{ purchase_order: unknown; goods_receipts: Row[]; purchase_invoices: Row[] }> {
  const [poRow] = await db.select().from(mm_purchase_orders).where(eq(mm_purchase_orders.id, pid)).limit(1);
  const receipts = await db.select().from(mm_goods_receipts_ext).where(eq(mm_goods_receipts_ext.purchase_order_id, pid));
  const invoices = poRow?.vendor_id
    ? await db.select().from(purchase_invoices).where(eq(purchase_invoices.vendor_id, poRow.vendor_id))
    : [];
  return { purchase_order: poRow ?? null, goods_receipts: receipts as Row[], purchase_invoices: invoices as Row[] };
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
