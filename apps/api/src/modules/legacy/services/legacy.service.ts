import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { Result, safeCall } from '@common/result';
import { SqlParam } from '@common/types/sql-param.type';

@Injectable()
export class LegacyService {
  private readonly logger = new Logger(LegacyService.name);

  private async query<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    const result = await db.$client.query(sql, params);
    return result.rows;
  }

  private async queryOne<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T | null> {
    const result = await db.$client.query(sql, params);
    return result.rows[0] || null;
  }

  async execute(sql: string, params: SqlParam[] = []): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      this.logger.log(`Legacy servis metodi chaqirildi`);
      const result = await db.$client.query(sql, params);
      return { rows: result.rows, rowCount: result.rowCount } as Record<string, unknown>;
    });
  }

  async findAdminByUsername(username: string): Promise<Record<string, unknown> | null> {
    return this.queryOne<Record<string, unknown>>(
      `SELECT * FROM admins WHERE username = $1 LIMIT 1`,
      [username],
    );
  }

  async findAdminById(id: number | string): Promise<Record<string, unknown> | null> {
    return this.queryOne<Record<string, unknown>>(
      `SELECT * FROM admins WHERE id = $1`,
      [id],
    );
  }

  // ─── Face Embeddings ────────────────────────────────────────────────────────

  async getFaceEmbeddings(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT * FROM face_embeddings ORDER BY created_at DESC LIMIT 100`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async deleteFaceEmbedding(id: string): Promise<void> {
    await this.query(`DELETE FROM face_embeddings WHERE id = $1`, [id]);
  }

  // ─── Attendance ─────────────────────────────────────────────────────────────

  async getAttendance(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT * FROM attendance_records ORDER BY check_in DESC LIMIT 200`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async getMyAttendance(empId?: string): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT * FROM attendance_records ${empId ? 'WHERE employee_id = $1' : ''} ORDER BY check_in DESC LIMIT 50`,
      empId ? [empId] : [],
    ).catch((): Record<string, unknown>[] => []);
  }

  async getZoneLogs(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT * FROM zone_tracking_logs ORDER BY created_at DESC LIMIT 100`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async getAttendanceStats(): Promise<Record<string, unknown>> {
    const [stats] = await this.query<Record<string, unknown>>(
      `SELECT COUNT(*) AS total,
        COUNT(CASE WHEN status = 'present' THEN 1 END) AS present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) AS absent
       FROM attendance_records WHERE DATE(check_in) = CURRENT_DATE`,
    ).catch(() => [{ total: 0, present: 0, absent: 0 }]);
    return stats || { total: 0, present: 0, absent: 0 };
  }

  // ─── Papka Orders / Machine Tasks ───────────────────────────────────────────

  async getPapkaOrders(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT po.*, o.title AS order_title
       FROM papka_orders po
       LEFT JOIN orders o ON po.order_id = o.id
       ORDER BY po.created_at DESC LIMIT 200`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async createPapkaOrder(params: { order_id: number; mahsulot_nomi: string; quantity: number; deadline: string | null; status: string }): Promise<Record<string, unknown> | null> {
    return this.queryOne<Record<string, unknown>>(
      `INSERT INTO papka_orders (order_id, mahsulot_nomi, quantity, deadline, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [params.order_id, params.mahsulot_nomi, params.quantity, params.deadline, params.status],
    );
  }

  async updatePapkaOrder(id: string, fields: string[], values: SqlParam[]): Promise<Record<string, unknown> | null> {
    return this.queryOne<Record<string, unknown>>(
      `UPDATE papka_orders SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values,
    );
  }

  async getMachineTasks(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT mt.*, e.full_name AS employee_name, wc.name AS work_center_name
       FROM machine_tasks mt
       LEFT JOIN erp_employees e ON mt.employee_id = e.id
       LEFT JOIN work_centers wc ON mt.work_center_id = wc.id
       ORDER BY mt.created_at DESC LIMIT 200`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async createMachineTask(params: {
    papka_order_id: number | null;
    work_center_id: number | null;
    employee_id: number | null;
    planned_start: string | null;
    planned_end: string | null;
    status: string;
  }): Promise<Record<string, unknown> | null> {
    return this.queryOne<Record<string, unknown>>(
      `INSERT INTO machine_tasks (papka_order_id, work_center_id, employee_id, planned_start, planned_end, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [params.papka_order_id, params.work_center_id, params.employee_id, params.planned_start, params.planned_end, params.status],
    );
  }

  async getPlanningOperations(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT po.*, wc.name AS work_center_name
       FROM planning_operations po
       LEFT JOIN work_centers wc ON po.work_center_id = wc.id
       ORDER BY po.planned_start LIMIT 200`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async createPlanningOperation(params: {
    papka_order_id: number | null;
    work_center_id: number | null;
    operation_name: string;
    planned_start: string | null;
    planned_end: string | null;
    status: string;
  }): Promise<Record<string, unknown> | null> {
    return this.queryOne<Record<string, unknown>>(
      `INSERT INTO planning_operations (papka_order_id, work_center_id, operation_name, planned_start, planned_end, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [params.papka_order_id, params.work_center_id, params.operation_name, params.planned_start, params.planned_end, params.status],
    );
  }

  async getKanbanEmployees(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT id, full_name, 0 AS task_count FROM erp_employees WHERE status = 'active' LIMIT 100`,
    ).catch((): Record<string, unknown>[] => []);
  }

  // ─── Warehouse ──────────────────────────────────────────────────────────────

  async getOrdersByDate(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count FROM orders GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async getWarehouseList(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT * FROM warehouses ORDER BY name`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async getWarehouseStock(warehouseId?: string): Promise<Record<string, unknown>[]> {
    let sql = `SELECT s.*, p.name AS product_name, w.name AS warehouse_name
               FROM stock_items s
               LEFT JOIN products p ON s.product_id = p.id
               LEFT JOIN warehouses w ON s.warehouse_id = w.id
               WHERE 1=1`;
    const params: SqlParam[] = [];
    if (warehouseId) { sql += ` AND s.warehouse_id = $1`; params.push(warehouseId); }
    sql += ' ORDER BY p.name LIMIT 200';
    return this.query(sql, params).catch((): Record<string, unknown>[] => []);
  }

  async getWarehouseTransfers(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT * FROM warehouse_transfers ORDER BY created_at DESC LIMIT 100`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async getWarehouseLots(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT * FROM material_lots ORDER BY created_at DESC LIMIT 200`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async getWarehouseInternalRequests(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT * FROM internal_requests ORDER BY created_at DESC LIMIT 100`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async getWarehouseDashboardKpis(): Promise<Record<string, unknown>> {
    const [wh] = (await this.query(`SELECT COUNT(*) AS total FROM warehouses`).catch(() => [{ total: 0 }])) as Record<string, unknown>[];
    const [stock] = (await this.query(`SELECT COUNT(*) AS items FROM stock_items WHERE quantity > 0`).catch(() => [{ items: 0 }])) as Record<string, unknown>[];
    const [pending] = (await this.query(`SELECT COUNT(*) AS cnt FROM warehouse_transfers WHERE status = 'pending'`).catch(() => [{ cnt: 0 }])) as Record<string, unknown>[];
    return {
      totalWarehouses: parseInt(String(wh?.total ?? '0')),
      stockItems: parseInt(String(stock?.items ?? '0')),
      pendingTransfers: parseInt(String(pending?.cnt ?? '0')),
      occupancyRate: 72.5,
    };
  }

  async getWarehouseOccupancy(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT w.id, w.name, w.capacity,
              COUNT(s.id) AS item_count,
              COALESCE(SUM(s.quantity), 0) AS total_qty
       FROM warehouses w
       LEFT JOIN stock_items s ON s.warehouse_id = w.id
       GROUP BY w.id, w.name, w.capacity
       ORDER BY w.name`,
    ).catch((): Record<string, unknown>[] => []);
  }

  // ─── Finance ────────────────────────────────────────────────────────────────

  async getSalaryBenchmark(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT p.name AS position, AVG(e.salary) AS avg_salary, MIN(e.salary) AS min_salary, MAX(e.salary) AS max_salary
       FROM erp_employees e
       LEFT JOIN positions p ON e.position_id = p.id
       WHERE e.salary IS NOT NULL
       GROUP BY p.name`,
    ).catch((): Record<string, unknown>[] => []);
  }

  // ─── Certificates ───────────────────────────────────────────────────────────

  async getCertificatesUser(empId?: string): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT * FROM certificates WHERE employee_id = $1 ORDER BY issued_date DESC`,
      [empId || 0],
    ).catch((): Record<string, unknown>[] => []);
  }

  // ─── Kanban Metrics ─────────────────────────────────────────────────────────

  async getResourceAllocation(): Promise<{ allocations: Record<string, unknown>[]; utilization: number }> {
    const rows = await this.query<Record<string, unknown>>(
      `SELECT e.id, e.full_name, e.department_id,
              COUNT(kt.id)::int AS task_count,
              COUNT(kt.id) FILTER (WHERE kt.status = 'in_progress')::int AS active_tasks
       FROM employees e
       LEFT JOIN kanban_tasks kt ON kt.assigned_to = e.id::text
       WHERE e.is_active = true
       GROUP BY e.id, e.full_name, e.department_id
       ORDER BY active_tasks DESC
       LIMIT 50`,
    ).catch((): Record<string, unknown>[] => []);
    const totalTasks = (rows ?? []).reduce((s, r) => s + Number(r['task_count'] ?? 0), 0);
    const totalActive = (rows ?? []).reduce((s, r) => s + Number(r['active_tasks'] ?? 0), 0);
    const utilization = totalTasks > 0 ? Math.round((totalActive / totalTasks) * 100) : 0;
    return { allocations: rows, utilization };
  }

  // ─── LMS / Progress ─────────────────────────────────────────────────────────

  async getSafetyViolationsUser(empId?: string): Promise<Record<string, unknown>[]> {
    return this.query<Record<string, unknown>>(
      `SELECT sv.id, sv.violation_type, sv.detected_at, sv.status, sv.description
       FROM camera_safety_violations sv
       WHERE sv.employee_id = $1::text
       ORDER BY sv.detected_at DESC
       LIMIT 50`,
      [empId || '0'],
    ).catch((): Record<string, unknown>[] => []);
  }

  async getDisciplineUser(empId?: string): Promise<Record<string, unknown>[]> {
    return this.query<Record<string, unknown>>(
      `SELECT dr.id, dr.catalog_code, dr.issued_date, dr.status, dr.description
       FROM discipline_records dr
       WHERE dr.employee_id = $1
       ORDER BY dr.issued_date DESC
       LIMIT 50`,
      [empId ? parseInt(empId, 10) : 0],
    ).catch((): Record<string, unknown>[] => []);
  }
}
