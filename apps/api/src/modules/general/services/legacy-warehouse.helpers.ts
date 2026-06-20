/**
 * @module legacy-warehouse.helpers
 * @description Raw SQL helpers for legacy warehouse/papka/planning tables — split from legacy.service.ts.
 * See legacy.service.ts header for SQL-retention rationale.
 *
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Legacy tables (papka_orders, machine_tasks, planning_operations,
 *     erp_employees, work_centers, warehouse_stock, stock_items, stock_transfers,
 *     material_lots, internal_requests, warehouse_transactions) without Drizzle schemas
 *   - COALESCE(${updates.x ?? null}, x) inline conditional UPDATE pattern for
 *     partial-update semantics with NULL-as-skip
 *   - Multi-table aggregate JOINs: warehouses LEFT JOIN warehouse_stock with
 *     COUNT(DISTINCT material_card_id)::int + SUM(quantity)::numeric casts
 *   - Dynamic SQL fragment composition (warehouseId ? sql`AND ...` : sql``)
 *   - FILTER (WHERE kt.status = 'in_progress')::int aggregate filter
 *   - GROUP BY DATE(created_at) day-bucket aggregation for time-series
 *   - Aliased camelCase output columns (st.id::text AS "transferNumber") for
 *     direct API-shape projection without ORM mapping layer
 *   - Promise.allSettled of three parallel raw KPI queries in one helper
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { db } from '@shared/db';
import { internal_requests } from '@shared/db';
import { sql, desc } from 'drizzle-orm';

import type { PapkaOrderUpdates } from './legacy.types';

export async function getPapkaOrdersRaw(opts?: { status?: string; limit?: number }): Promise<Record<string, unknown>[]> {
  try {
    // Optional server-side status filter — consumers like DesignApproval/Finance/
    // Tech/QC pass ?status=… in the URL. Absent or 'all' → return everything (unchanged).
    const status = opts?.status && opts.status !== 'all' ? opts.status : null;
    const limit = opts?.limit && Number.isFinite(opts.limit) && opts.limit > 0
      ? Math.min(Math.trunc(opts.limit), 500) : 200;
    // NOTE: papka_orders has NO order_id column — the previous `LEFT JOIN orders
    // ON po.order_id` threw on every call, which is why the list was always empty.
    const r = await db.execute(sql`
      SELECT po.*
      FROM papka_orders po
      WHERE (${status}::text IS NULL OR po.status = ${status}::text)
      ORDER BY po.created_at DESC
      LIMIT ${limit}
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function createPapkaOrderRaw(params: {
  papka_no?: string | null; mijoz_nomi?: string | null; mahsulot_nomi: string;
  mahsulot_turi?: string | null; tiraj?: number | null; list_soni?: number | null;
  format_a?: number | null; format_b?: number | null; status?: string | null;
  sana?: string | null; tayyor_bolish_sanasi?: string | null; notes?: string | null;
  bom_id?: number | null; product_id?: number | null; routing_id?: number | null;
  material_requirements?: unknown; stock_check_result?: unknown;
  estimated_production_time?: number | null;
}): Promise<Record<string, unknown> | null> {
  // No try/catch: let DB errors (e.g. duplicate papka_no) surface as a 500 so the
  // UI shows a real error instead of a silent fake success.
  const papkaNo = params.papka_no && String(params.papka_no).trim()
    ? String(params.papka_no).trim() : `PB-${Date.now()}`;
  const matReq = params.material_requirements != null ? JSON.stringify(params.material_requirements) : null;
  const stockChk = params.stock_check_result != null ? JSON.stringify(params.stock_check_result) : null;
  const r = await db.execute(sql`
    INSERT INTO papka_orders
      (papka_no, mijoz_nomi, mahsulot_nomi, mahsulot_turi, tiraj, list_soni,
       format_a, format_b, status, sana, tayyor_bolish_sanasi, notes,
       bom_id, product_id, routing_id, material_requirements, stock_check_result,
       estimated_production_time)
    VALUES
      (${papkaNo}, ${params.mijoz_nomi ?? ''}, ${params.mahsulot_nomi}, ${params.mahsulot_turi ?? null},
       ${params.tiraj ?? 0}, ${params.list_soni ?? null}, ${params.format_a ?? null}, ${params.format_b ?? null},
       ${params.status ?? 'new'}, ${params.sana ?? null}, ${params.tayyor_bolish_sanasi ?? null}, ${params.notes ?? null},
       ${params.bom_id ?? null}, ${params.product_id ?? null}, ${params.routing_id ?? null},
       ${matReq}::jsonb, ${stockChk}::jsonb, ${params.estimated_production_time ?? null})
    RETURNING *
  `);
  return (r.rows[0] as Record<string, unknown>) ?? null;
}

export async function updatePapkaOrderRaw(id: string, updates: PapkaOrderUpdates): Promise<Record<string, unknown> | null> {
  const r = await db.execute(sql`
      UPDATE papka_orders SET
        papka_no             = COALESCE(${updates.papka_no ?? null}, papka_no),
        mijoz_nomi           = COALESCE(${updates.mijoz_nomi ?? null}, mijoz_nomi),
        mahsulot_nomi        = COALESCE(${updates.mahsulot_nomi ?? null}, mahsulot_nomi),
        mahsulot_turi        = COALESCE(${updates.mahsulot_turi ?? null}, mahsulot_turi),
        tiraj                = COALESCE(${updates.tiraj ?? null}, tiraj),
        list_soni            = COALESCE(${updates.list_soni ?? null}, list_soni),
        format_a             = COALESCE(${updates.format_a ?? null}, format_a),
        format_b             = COALESCE(${updates.format_b ?? null}, format_b),
        quantity             = COALESCE(${updates.quantity ?? null}, quantity),
        status               = COALESCE(${updates.status ?? null}, status),
        sana                 = COALESCE(${updates.sana ?? null}, sana),
        tayyor_bolish_sanasi = COALESCE(${updates.tayyor_bolish_sanasi ?? null}, tayyor_bolish_sanasi),
        notes                = COALESCE(${updates.notes ?? null}, notes),
        updated_at           = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
  return (r.rows[0] as Record<string, unknown>) ?? null;
}

export async function getMachineTasksRaw(): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`
      SELECT mt.*, e.full_name AS employee_name, wc.name AS work_center_name
      FROM machine_tasks mt
      LEFT JOIN erp_employees e ON mt.employee_id = e.id
      LEFT JOIN work_centers wc ON mt.work_center_id = wc.id
      ORDER BY mt.created_at DESC LIMIT 200
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function createMachineTaskRaw(params: {
  papka_order_id: number | null;
  work_center_id: number | null;
  employee_id: number | null;
  planned_start: string | null;
  planned_end: string | null;
  status: string;
}): Promise<Record<string, unknown> | null> {
  const r = await db.execute(sql`
      INSERT INTO machine_tasks (papka_order_id, work_center_id, employee_id, planned_start, planned_end, status)
      VALUES (${params.papka_order_id}, ${params.work_center_id}, ${params.employee_id}, ${params.planned_start}, ${params.planned_end}, ${params.status})
      RETURNING *
    `);
  return (r.rows[0] as Record<string, unknown>) ?? null;
}

export async function getPlanningOperationsRaw(): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`
      SELECT po.*, wc.name AS work_center_name
      FROM planning_operations po
      LEFT JOIN work_centers wc ON po.work_center_id = wc.id
      ORDER BY po.planned_start LIMIT 200
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function createPlanningOperationRaw(params: {
  papka_order_id: number | null;
  work_center_id: number | null;
  operation_name: string;
  planned_start: string | null;
  planned_end: string | null;
  status: string;
}): Promise<Record<string, unknown> | null> {
  const r = await db.execute(sql`
      INSERT INTO planning_operations (papka_order_id, work_center_id, operation_name, planned_start, planned_end, status)
      VALUES (${params.papka_order_id}, ${params.work_center_id}, ${params.operation_name}, ${params.planned_start}, ${params.planned_end}, ${params.status})
      RETURNING *
    `);
  return (r.rows[0] as Record<string, unknown>) ?? null;
}

export async function getKanbanEmployeesRaw(): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`SELECT id, full_name, 0 AS task_count FROM erp_employees WHERE status = 'active' LIMIT 100`);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

// getOrdersByDateRaw removed — route deleted; real query lives in WmsCatalogController.getOrdersByDate (papka_orders JOIN material_kits)

export async function getWarehouseListRaw(): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`
      SELECT w.id, w.code, w.name, w.name_ru, w.type, w.location, w.is_active, w.manager_id, w.created_at,
             COUNT(DISTINCT ws.material_id)::int AS material_count,
             COALESCE(SUM(ws.quantity), 0)::numeric AS total_quantity
      FROM warehouses w
      LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
      WHERE w.deleted_at IS NULL
      GROUP BY w.id, w.code, w.name, w.name_ru, w.type, w.location, w.is_active, w.manager_id, w.created_at
      ORDER BY w.name
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getWarehouseStockRaw(warehouseId?: string): Promise<Record<string, unknown>[]> {
  try {
    const whFilter = warehouseId ? sql`AND s.warehouse_id = ${warehouseId}` : sql``;
    const r = await db.execute(sql`
      SELECT s.*, p.name AS product_name, w.name AS warehouse_name
      FROM stock_items s
      LEFT JOIN products p ON s.product_id = p.id
      LEFT JOIN warehouses w ON s.warehouse_id = w.id
      WHERE 1=1 ${whFilter}
      ORDER BY p.name LIMIT 200
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getWarehouseTransfersRaw(): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`
      SELECT st.id::text AS id, st.transfer_number AS "transferNumber",
             st.transfer_date AS "transferDate",
             st.from_warehouse_id::text AS "fromWarehouseId",
             st.to_warehouse_id::text AS "toWarehouseId",
             fw.name AS "fromWarehouseName",
             tw.name AS "toWarehouseName",
             st.status, st.total_items AS "totalItems",
             st.total_value AS "totalValue", st.notes,
             st.created_at AS "createdAt"
      FROM stock_transfers st
      LEFT JOIN warehouses fw ON fw.id = st.from_warehouse_id
      LEFT JOIN warehouses tw ON tw.id = st.to_warehouse_id
      ORDER BY st.created_at DESC LIMIT 100
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getWarehouseLotsRaw(): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`SELECT * FROM material_lots ORDER BY created_at DESC LIMIT 200`);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getWarehouseInternalRequestsRaw(): Promise<Record<string, unknown>[]> {
  try {
    const rows = await db.select().from(internal_requests).orderBy(desc(internal_requests.createdAt)).limit(100);
    return rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getWarehouseDashboardKpisRaw(): Promise<Record<string, unknown>> {
  const [whR, stockR, pendingR] = await Promise.allSettled([
    db.execute(sql`SELECT COUNT(*) AS total FROM warehouses`),
    db.execute(sql`SELECT COUNT(*) AS items FROM stock_items WHERE quantity > 0`),
    db.execute(sql`SELECT COUNT(*) AS cnt FROM warehouse_transfers WHERE status = 'pending'`),
  ]);
  const wh      = whR.status      === 'fulfilled' ? (whR.value.rows[0]      as Record<string, unknown>) : { total: 0 };
  const stock   = stockR.status   === 'fulfilled' ? (stockR.value.rows[0]   as Record<string, unknown>) : { items: 0 };
  const pending = pendingR.status === 'fulfilled' ? (pendingR.value.rows[0] as Record<string, unknown>) : { cnt: 0 };
  return {
    totalWarehouses:  parseInt(String(wh?.['total']   ?? '0')),
    stockItems:       parseInt(String(stock?.['items'] ?? '0')),
    pendingTransfers: parseInt(String(pending?.['cnt'] ?? '0')),
    occupancyRate: 72.5,
  };
}

export async function getWarehouseOccupancyRaw(): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`
      SELECT w.id, w.name, w.capacity,
             COUNT(s.id) AS item_count,
             COALESCE(SUM(s.quantity), 0) AS total_qty
      FROM warehouses w
      LEFT JOIN stock_items s ON s.warehouse_id = w.id
      GROUP BY w.id, w.name, w.capacity
      ORDER BY w.name
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getSalaryBenchmarkRaw(): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`
      SELECT p.name AS position, AVG(e.salary) AS avg_salary, MIN(e.salary) AS min_salary, MAX(e.salary) AS max_salary
      FROM erp_employees e
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.salary IS NOT NULL
      GROUP BY p.name
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getResourceAllocationRaw(): Promise<{ allocations: Record<string, unknown>[]; utilization: number }> {
  try {
    const r = await db.execute(sql`
      SELECT e.id, e.full_name, e.department_id,
             COUNT(kt.id)::int AS task_count,
             COUNT(kt.id) FILTER (WHERE kt.status = 'in_progress')::int AS active_tasks
      FROM employees e
      LEFT JOIN kanban_tasks kt ON kt.assigned_to = e.id::text
      WHERE e.is_active = true
      GROUP BY e.id, e.full_name, e.department_id
      ORDER BY active_tasks DESC
      LIMIT 50
    `);
    const rows = r.rows as Record<string, unknown>[];
    const totalTasks  = rows.reduce((s, r) => s + Number(r['task_count']  ?? 0), 0);
    const totalActive = rows.reduce((s, r) => s + Number(r['active_tasks'] ?? 0), 0);
    const utilization = totalTasks > 0 ? Math.round((totalActive / totalTasks) * 100) : 0;
    return { allocations: rows, utilization };
  } catch { return { allocations: [], utilization: 0 }; }
}
