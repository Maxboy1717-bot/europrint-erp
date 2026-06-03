/**
 * @module queries-technology
 * @description Source module. See exports for details.
 */

import { db } from '@shared/db';
import { typedExecute } from '@shared/db/typed-execute';
import { papka_orders_tech, technology_approvals, tech_cards, clients } from '@shared/db';
import { eq, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

// NOTE: papka_orders_tech is re-exported from schema-business-c-1.ts (messaging schema).
// queries-technology expects the print-orders schema (papkaNo/mijozNomi/etc). All field
// accesses below are projected via raw SQL to preserve runtime behavior at the cost of
// some type safety. Once the duplicate papka_orders schemas are unified, revisit this.
// TODO PA-SCHEMA: papka_orders duplicate — schema-business-c-1.ts (messaging) vs
// canonical lib/db/src/schema/pp/pp-papka.ts (print orders). queries-technology.ts
// assumes the print-orders shape; here we project via raw SQL.

export async function queryTechOrders(status?: string): Promise<Row[]> {
  const t = papka_orders_tech as unknown as Record<string, never>;
  void t;
  const rows = await typedExecute<Row>(sql`
    SELECT
      po.id::text AS id,
      po.papka_no AS "papkaNo",
      COALESCE(c.name, po.mijoz_nomi, 'Noma''lum') AS "mijozNomi",
      COALESCE(po.mahsulot_nomi, '-') AS "mahsulotNomi",
      COALESCE(po.mahsulot_turi, '-') AS "mahsulotTuri",
      COALESCE(po.tiraj, 0) AS tiraj,
      COALESCE(po.format_a, 0) AS "formatA",
      COALESCE(po.format_b, 0) AS "formatB",
      po.tayyor_bolish_sanasi::text AS "tayyorBolishSanasi",
      po.status AS status
    FROM papka_orders po
    LEFT JOIN clients c ON c.id::text = po.mijoz_nomi
    WHERE ${status ? sql`po.status = ${status}` : sql`TRUE`}
    ORDER BY po.created_at DESC
    LIMIT 100
  `);
  void clients; void eq;
  return rows;
}

// Functions below use raw SQL to access the print-orders papka_orders schema
// since the typed re-export points to the messaging variant.
// TODO PA-SCHEMA: Unify papka_orders duplicates and restore Drizzle column access.

export async function queryTechApprovalLog(orderId: string): Promise<Row> {
  const rows = await typedExecute<Row>(sql`
    SELECT
      ta.id::text AS id,
      po.papka_no AS order_no,
      po.status AS current_status,
      COALESCE(ta.action, 'pending') AS tech_action,
      ta.bom_approved,
      ta.routing_approved,
      ta.tech_card_approved,
      ta.approved_at::text AS approved_at,
      (SELECT full_name FROM users WHERE id::text = ta.approved_by_id::text LIMIT 1) AS approved_by,
      ta.notes,
      ta.is_rejected
    FROM papka_orders po
    LEFT JOIN technology_approvals ta ON ta.papka_order_id = po.id::text
    WHERE po.id::text = ${orderId}
    LIMIT 1
  `);
  const out = rows[0];
  return (out ?? {}) as Row;
}

export async function queryTechDashboardStats(): Promise<Row> {
  const rows = await typedExecute<Row>(sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending_tech') AS pending,
      COUNT(*) FILTER (WHERE status = 'approved' AND updated_at::date = CURRENT_DATE) AS approved_today,
      COUNT(*) FILTER (WHERE status = 'rejected' AND updated_at::date = CURRENT_DATE) AS rejected_today
    FROM papka_orders
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `);
  const out = rows[0];
  return (out ?? {}) as Row;
}

export async function queryTechCards(): Promise<Row[]> {
  const rows = await typedExecute<Row>(sql`
    SELECT
      tc.id::text AS id,
      tc.papka_order_id::text AS order_id,
      po.papka_no AS order_number,
      tc.material,
      tc.ink_colors,
      tc.print_type,
      tc.finishing,
      tc.created_at::text AS created_at
    FROM tech_cards tc
    LEFT JOIN papka_orders po ON po.id = tc.papka_order_id
    ORDER BY tc.created_at DESC
    LIMIT 50
  `);
  return rows;
}

export async function queryOrderTechCard(orderId: string): Promise<Row> {
  const rows = await typedExecute<Row>(sql`
    SELECT
      tc.id,
      tc.papka_order_id,
      tc.material,
      tc.ink_colors,
      tc.print_type,
      tc.finishing,
      tc.created_at,
      po.papka_no AS order_number
    FROM tech_cards tc
    LEFT JOIN papka_orders po ON po.id = tc.papka_order_id
    WHERE tc.papka_order_id = ${Number(orderId)}
    LIMIT 1
  `);
  const out = rows[0];
  return (out ?? { orderId, message: 'Texkarta yaratilmagan' }) as Row;
}

export async function queryRunAiCheck(orderId: string): Promise<Row> {
  const rows = await typedExecute<Row>(sql`
    SELECT
      po.papka_no AS order_number,
      po.tiraj AS quantity,
      po.format_a AS format_width,
      po.format_b AS format_height,
      po.mahsulot_turi AS product_type,
      tc.id AS tech_card_id
    FROM papka_orders po
    LEFT JOIN tech_cards tc ON tc.papka_order_id = po.id
    WHERE po.id = ${Number(orderId)}
    LIMIT 1
  `);
  const out = rows[0];
  return (out ?? {}) as Row;
}

export async function execTechApproveOrder(orderId: string, data: { bomApproved: boolean; routingApproved: boolean; techCardApproved: boolean; notes?: string; approvedById: string }): Promise<void> {
  await db.execute(sql`
    UPDATE papka_orders SET status = 'approved', updated_at = NOW()
    WHERE id = ${Number(orderId)}
  `);

  await db.insert(technology_approvals).values({
    papka_order_id: orderId,
    action: 'approved',
    bom_approved: data.bomApproved,
    routing_approved: data.routingApproved,
    tech_card_approved: data.techCardApproved,
    notes: data.notes ?? null,
    approved_by_id: data.approvedById,
    approved_at: new Date(),
    is_rejected: false,
  }).onConflictDoUpdate({
    target: technology_approvals.papka_order_id,
    set: {
      action: 'approved',
      bom_approved: data.bomApproved,
      routing_approved: data.routingApproved,
      tech_card_approved: data.techCardApproved,
      notes: data.notes ?? null,
      approved_by_id: data.approvedById,
      approved_at: new Date(),
      is_rejected: false,
      updated_at: sql`NOW()`,
    },
  });
}

export async function execTechRejectOrder(orderId: string, data: { reason: string; returnTo: string; rejectedById: string }): Promise<void> {
  const returnStatus = data.returnTo === 'designer' ? 'pending_design' : 'pending_manager';
  await db.execute(sql`
    UPDATE papka_orders SET status = ${returnStatus}, updated_at = NOW()
    WHERE id = ${Number(orderId)}
  `);

  await db.insert(technology_approvals).values({
    papka_order_id: orderId,
    action: 'rejected',
    notes: data.reason,
    approved_by_id: data.rejectedById,
    approved_at: new Date(),
    is_rejected: true,
  }).onConflictDoUpdate({
    target: technology_approvals.papka_order_id,
    set: {
      action: 'rejected',
      notes: data.reason,
      approved_by_id: data.rejectedById,
      approved_at: new Date(),
      is_rejected: true,
      updated_at: sql`NOW()`,
    },
  });
}
