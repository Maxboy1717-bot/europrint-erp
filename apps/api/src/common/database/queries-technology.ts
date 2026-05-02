import { db } from '@shared/db';
import { papka_orders_tech, technology_approvals, tech_cards, clients } from '@shared/db';
import { eq, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export async function queryTechOrders(status?: string): Promise<Row[]> {
  const rows = await db.select({
    id:                 sql<string>`${papka_orders_tech.id}::text`,
    papkaNo:            papka_orders_tech.order_number,
    mijozNomi:          sql<string>`COALESCE(${clients.name}, ${papka_orders_tech.client_name}, 'Noma''lum')`,
    mahsulotNomi:       sql<string>`COALESCE(${papka_orders_tech.product_name}, '-')`,
    mahsulotTuri:       sql<string>`COALESCE(${papka_orders_tech.product_type}, '-')`,
    tiraj:              sql<number>`COALESCE(${papka_orders_tech.quantity}, 0)`,
    formatA:            sql<number>`COALESCE(${papka_orders_tech.format_width}, 0)`,
    formatB:            sql<number>`COALESCE(${papka_orders_tech.format_height}, 0)`,
    tayyorBolishSanasi: sql<string>`${papka_orders_tech.deadline}::text`,
    status:             papka_orders_tech.status,
  })
    .from(papka_orders_tech)
    .leftJoin(clients, eq(sql`${clients.id}::text`, papka_orders_tech.client_name))
    .where(status ? eq(papka_orders_tech.status, status) : sql`TRUE`)
    .orderBy(sql`${papka_orders_tech.created_at} DESC`)
    .limit(100);
  return rows as Row[];
}

export async function queryTechApprovalLog(orderId: string): Promise<Row> {
  const rows = await db.select({
    id:              sql<string>`${technology_approvals.id}::text`,
    order_no:        papka_orders_tech.order_number,
    current_status:  papka_orders_tech.status,
    tech_action:     sql<string>`COALESCE(${technology_approvals.action}, 'pending')`,
    bom_approved:    technology_approvals.bom_approved,
    routing_approved: technology_approvals.routing_approved,
    tech_card_approved: technology_approvals.tech_card_approved,
    approved_at:     sql<string>`${technology_approvals.approved_at}::text`,
    approved_by:     sql<string>`(SELECT full_name FROM users WHERE id::text = ${technology_approvals.approved_by_id}::text LIMIT 1)`,
    notes:           technology_approvals.notes,
    is_rejected:     technology_approvals.is_rejected,
  })
    .from(papka_orders_tech)
    .leftJoin(technology_approvals, eq(technology_approvals.papka_order_id, sql`${papka_orders_tech.id}::text`))
    .where(eq(sql`${papka_orders_tech.id}::text`, orderId))
    .limit(1);
  return (rows[0] ?? {}) as Row;
}

export async function queryTechDashboardStats(): Promise<Row> {
  const rows = await db.select({
    pending:        sql<number>`COUNT(*) FILTER (WHERE ${papka_orders_tech.status} = 'pending_tech')`,
    approved_today: sql<number>`COUNT(*) FILTER (WHERE ${papka_orders_tech.status} = 'approved' AND ${papka_orders_tech.updated_at}::date = CURRENT_DATE)`,
    rejected_today: sql<number>`COUNT(*) FILTER (WHERE ${papka_orders_tech.status} = 'rejected' AND ${papka_orders_tech.updated_at}::date = CURRENT_DATE)`,
  })
    .from(papka_orders_tech)
    .where(sql`${papka_orders_tech.created_at} >= NOW() - INTERVAL '30 days'`);
  return (rows[0] ?? {}) as Row;
}

export async function queryTechCards(): Promise<Row[]> {
  const rows = await db.select({
    id:         sql<string>`${tech_cards.id}::text`,
    order_id:   sql<string>`${tech_cards.papka_order_id}::text`,
    order_number: papka_orders_tech.order_number,
    material:   tech_cards.material,
    ink_colors: tech_cards.ink_colors,
    print_type: tech_cards.print_type,
    finishing:  tech_cards.finishing,
    created_at: sql<string>`${tech_cards.created_at}::text`,
  })
    .from(tech_cards)
    .leftJoin(papka_orders_tech, eq(papka_orders_tech.id, tech_cards.papka_order_id))
    .orderBy(sql`${tech_cards.created_at} DESC`)
    .limit(50);
  return rows as Row[];
}

export async function queryOrderTechCard(orderId: string): Promise<Row> {
  const rows = await db.select({
    id:             tech_cards.id,
    papka_order_id: tech_cards.papka_order_id,
    material:       tech_cards.material,
    ink_colors:     tech_cards.ink_colors,
    print_type:     tech_cards.print_type,
    finishing:      tech_cards.finishing,
    created_at:     tech_cards.created_at,
    order_number:   papka_orders_tech.order_number,
  })
    .from(tech_cards)
    .leftJoin(papka_orders_tech, eq(papka_orders_tech.id, tech_cards.papka_order_id))
    .where(eq(tech_cards.papka_order_id, Number(orderId)))
    .limit(1);
  return (rows[0] ?? { orderId, message: 'Texkarta yaratilmagan' }) as Row;
}

export async function queryRunAiCheck(orderId: string): Promise<Row> {
  const rows = await db.select({
    order_number:   papka_orders_tech.order_number,
    quantity:       papka_orders_tech.quantity,
    format_width:   papka_orders_tech.format_width,
    format_height:  papka_orders_tech.format_height,
    product_type:   papka_orders_tech.product_type,
    tech_card_id:   tech_cards.id,
  })
    .from(papka_orders_tech)
    .leftJoin(tech_cards, eq(tech_cards.papka_order_id, papka_orders_tech.id))
    .where(eq(papka_orders_tech.id, Number(orderId)))
    .limit(1);
  return (rows[0] ?? {}) as Row;
}

export async function execTechApproveOrder(orderId: string, data: { bomApproved: boolean; routingApproved: boolean; techCardApproved: boolean; notes?: string; approvedById: string }): Promise<void> {
  await db.update(papka_orders_tech)
    .set({ status: 'approved', updated_at: sql`NOW()` })
    .where(eq(papka_orders_tech.id, Number(orderId)));

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
  await db.update(papka_orders_tech)
    .set({ status: returnStatus, updated_at: sql`NOW()` })
    .where(eq(papka_orders_tech.id, Number(orderId)));

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
