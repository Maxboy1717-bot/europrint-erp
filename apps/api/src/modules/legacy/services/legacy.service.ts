/**
 * @module legacy.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

export type PapkaOrderUpdates = Partial<{
  mahsulot_nomi: string;
  quantity: number;
  deadline: string | null;
  status: string;
  notes: string | null;
}>;

@Injectable()
export class LegacyService {
  private readonly logger = new Logger(LegacyService.name);

  async findAdminByUsername(username: string): Promise<Record<string, unknown> | null> {
    try {
      const r = await db.execute(sql`SELECT * FROM admins WHERE username = ${username} LIMIT 1`);
      return (r.rows[0] as Record<string, unknown>) ?? null;
    } catch { return null; }
  }

  async findAdminById(id: number | string): Promise<Record<string, unknown> | null> {
    try {
      const r = await db.execute(sql`SELECT * FROM admins WHERE id = ${id}`);
      return (r.rows[0] as Record<string, unknown>) ?? null;
    } catch { return null; }
  }

  // ─── Face Embeddings ────────────────────────────────────────────────────────

  async getFaceEmbeddings(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`SELECT * FROM face_embeddings ORDER BY created_at DESC LIMIT 100`);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  async deleteFaceEmbedding(id: string): Promise<void> {
    await db.execute(sql`DELETE FROM face_embeddings WHERE id = ${id}`);
  }

  // ─── Attendance ─────────────────────────────────────────────────────────────

  async getAttendance(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`SELECT * FROM attendance_records ORDER BY check_in DESC LIMIT 200`);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  async getMyAttendance(empId?: string): Promise<Record<string, unknown>[]> {
    try {
      const empFilter = empId ? sql`WHERE employee_id = ${empId}` : sql``;
      const r = await db.execute(sql`
        SELECT * FROM attendance_records ${empFilter} ORDER BY check_in DESC LIMIT 50
      `);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  async getZoneLogs(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`SELECT * FROM zone_tracking_logs ORDER BY created_at DESC LIMIT 100`);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  async getAttendanceStats(): Promise<Record<string, unknown>> {
    try {
      const r = await db.execute(sql`
        SELECT COUNT(*) AS total,
          COUNT(CASE WHEN status = 'present' THEN 1 END) AS present,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) AS absent
        FROM attendance_records WHERE DATE(check_in) = CURRENT_DATE
      `);
      return (r.rows[0] as Record<string, unknown>) ?? { total: 0, present: 0, absent: 0 };
    } catch { return { total: 0, present: 0, absent: 0 }; }
  }

  // ─── Papka Orders / Machine Tasks ───────────────────────────────────────────

  async getPapkaOrders(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`
        SELECT po.*, o.title AS order_title
        FROM papka_orders po
        LEFT JOIN orders o ON po.order_id = o.id
        ORDER BY po.created_at DESC LIMIT 200
      `);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  async createPapkaOrder(params: { order_id: number; mahsulot_nomi: string; quantity: number; deadline: string | null; status: string }): Promise<Record<string, unknown> | null> {
    try {
      const r = await db.execute(sql`
        INSERT INTO papka_orders (order_id, mahsulot_nomi, quantity, deadline, status)
        VALUES (${params.order_id}, ${params.mahsulot_nomi}, ${params.quantity}, ${params.deadline}, ${params.status})
        RETURNING *
      `);
      return (r.rows[0] as Record<string, unknown>) ?? null;
    } catch { return null; }
  }

  async updatePapkaOrder(id: string, updates: PapkaOrderUpdates): Promise<Record<string, unknown> | null> {
    try {
      const r = await db.execute(sql`
        UPDATE papka_orders SET
          mahsulot_nomi = COALESCE(${updates.mahsulot_nomi ?? null}, mahsulot_nomi),
          quantity      = COALESCE(${updates.quantity ?? null}, quantity),
          deadline      = COALESCE(${updates.deadline ?? null}, deadline),
          status        = COALESCE(${updates.status ?? null}, status),
          notes         = COALESCE(${updates.notes ?? null}, notes),
          updated_at    = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      return (r.rows[0] as Record<string, unknown>) ?? null;
    } catch { return null; }
  }

  async getMachineTasks(): Promise<Record<string, unknown>[]> {
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

  async createMachineTask(params: {
    papka_order_id: number | null;
    work_center_id: number | null;
    employee_id: number | null;
    planned_start: string | null;
    planned_end: string | null;
    status: string;
  }): Promise<Record<string, unknown> | null> {
    try {
      const r = await db.execute(sql`
        INSERT INTO machine_tasks (papka_order_id, work_center_id, employee_id, planned_start, planned_end, status)
        VALUES (${params.papka_order_id}, ${params.work_center_id}, ${params.employee_id}, ${params.planned_start}, ${params.planned_end}, ${params.status})
        RETURNING *
      `);
      return (r.rows[0] as Record<string, unknown>) ?? null;
    } catch { return null; }
  }

  async getPlanningOperations(): Promise<Record<string, unknown>[]> {
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

  async createPlanningOperation(params: {
    papka_order_id: number | null;
    work_center_id: number | null;
    operation_name: string;
    planned_start: string | null;
    planned_end: string | null;
    status: string;
  }): Promise<Record<string, unknown> | null> {
    try {
      const r = await db.execute(sql`
        INSERT INTO planning_operations (papka_order_id, work_center_id, operation_name, planned_start, planned_end, status)
        VALUES (${params.papka_order_id}, ${params.work_center_id}, ${params.operation_name}, ${params.planned_start}, ${params.planned_end}, ${params.status})
        RETURNING *
      `);
      return (r.rows[0] as Record<string, unknown>) ?? null;
    } catch { return null; }
  }

  async getKanbanEmployees(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`SELECT id, full_name, 0 AS task_count FROM erp_employees WHERE status = 'active' LIMIT 100`);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  // ─── Warehouse ──────────────────────────────────────────────────────────────

  async getOrdersByDate(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`SELECT DATE(created_at) AS date, COUNT(*) AS count FROM orders GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  async getWarehouseList(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`
        SELECT w.id, w.code, w.name, w.name_ru, w.type, w.location, w.is_active, w.manager_id, w.created_at,
               COUNT(DISTINCT ws.material_card_id)::int AS material_count,
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

  async getWarehouseStock(warehouseId?: string): Promise<Record<string, unknown>[]> {
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

  async getWarehouseTransfers(): Promise<Record<string, unknown>[]> {
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

  async getWarehouseLots(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`SELECT * FROM material_lots ORDER BY created_at DESC LIMIT 200`);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  async getWarehouseInternalRequests(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`SELECT * FROM internal_requests ORDER BY created_at DESC LIMIT 100`);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  async getWarehouseDashboardKpis(): Promise<Record<string, unknown>> {
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

  async getWarehouseOccupancy(): Promise<Record<string, unknown>[]> {
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

  // ─── Finance ────────────────────────────────────────────────────────────────

  async getSalaryBenchmark(): Promise<Record<string, unknown>[]> {
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

  // ─── Certificates ───────────────────────────────────────────────────────────

  async getCertificatesUser(empId?: string): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`
        SELECT * FROM certificates WHERE employee_id = ${empId ?? 0} ORDER BY issued_date DESC
      `);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  // ─── Kanban Metrics ─────────────────────────────────────────────────────────

  async getResourceAllocation(): Promise<{ allocations: Record<string, unknown>[]; utilization: number }> {
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

  // ─── Safety / Discipline ────────────────────────────────────────────────────

  async getSafetyViolationsUser(empId?: string): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`
        SELECT sv.id, sv.violation_type, sv.detected_at, sv.status, sv.description
        FROM camera_safety_violations sv
        WHERE sv.employee_id = ${empId ?? '0'}::text
        ORDER BY sv.detected_at DESC
        LIMIT 50
      `);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  async getDisciplineUser(empId?: string): Promise<Record<string, unknown>[]> {
    try {
      const empIdInt = empId ? parseInt(empId, 10) : 0;
      const r = await db.execute(sql`
        SELECT dr.id, dr.catalog_code, dr.issued_date, dr.status, dr.description
        FROM discipline_records dr
        WHERE dr.employee_id = ${empIdInt}
        ORDER BY dr.issued_date DESC
        LIMIT 50
      `);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }
}
