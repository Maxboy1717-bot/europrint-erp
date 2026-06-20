/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Legacy compatibility shim over un-migrated tables (admins, face_embeddings,
 *     attendance_records, papka_orders, machine_tasks, planning_operations,
 *     erp_employees, zone_tracking_logs, stock_items, stock_transfers,
 *     warehouse_stock, warehouses) that have no Drizzle schema definitions
 *     in lib/db/src/schema/ — these tables were created by hand-written SQL
 *     migrations from the pre-Drizzle era and porting them is tracked
 *     separately (see CLAUDE.md "Qoida 15").
 *   - Conditional WHERE fragment composition (`empId ? sql`WHERE ...` : sql``;`)
 *     and `WHERE 1=1 ${whFilter}` patterns for optional filters.
 *   - COUNT(CASE WHEN status = 'present' ...) conditional aggregates for
 *     attendance stats (Drizzle has no FILTER clause helper).
 *   - DATE(created_at) day-grouped aggregation for orders timeline.
 *   - COALESCE(${col} ?? null, col) "partial update" pattern in UPDATE
 *     statements where only provided fields override existing values.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 *
 * Rule 16: This service is a facade. Heavy SQL helpers live in:
 *   - legacy-attendance.helpers.ts — admins/face/attendance/safety/certificates
 *   - legacy-warehouse.helpers.ts  — papka/machine/planning/warehouse/kpis
 *   - legacy.types.ts              — shared types
 */
/**
 * @module legacy.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * SECURITY: PA-S4a — historic `sql.raw(rawQuery)` pass-through has been
 *   refactored away. This file is now a thin facade re-exporting concern-scoped
 *   helpers (legacy-attendance.helpers.ts, legacy-warehouse.helpers.ts) that
 *   each use parameterised `sql\`...\${value}\`` templates. NO public method
 *   here accepts a raw SQL string from the caller. Future contributors: do
 *   NOT re-introduce a `runRawQuery(s: string)` method — translate via an
 *   IAclTranslator + repository pair instead (see context-map.md ACL section).
 */

import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result } from '@common/result';
import {
  findAdminByUsernameRaw, findAdminByIdRaw,
  getFaceEmbeddingsRaw, deleteFaceEmbeddingRaw,
  getAttendanceRaw, getMyAttendanceRaw, getZoneLogsRaw, getAttendanceStatsRaw,
  insertAttendanceRecordRaw,
  getSafetyViolationsUserRaw, getDisciplineUserRaw, getCertificatesUserRaw,
} from './legacy-attendance.helpers';
import {
  getPapkaOrdersRaw, createPapkaOrderRaw, updatePapkaOrderRaw,
  getMachineTasksRaw, createMachineTaskRaw,
  getPlanningOperationsRaw, createPlanningOperationRaw, getKanbanEmployeesRaw,
  getWarehouseListRaw, getWarehouseStockRaw,
  getWarehouseTransfersRaw, getWarehouseLotsRaw, getWarehouseInternalRequestsRaw,
  getWarehouseDashboardKpisRaw, getWarehouseOccupancyRaw,
  getSalaryBenchmarkRaw, getResourceAllocationRaw,
} from './legacy-warehouse.helpers';

export type { PapkaOrderUpdates } from './legacy.types';

@Injectable()
export class LegacyService {
  private readonly logger = new Logger(LegacyService.name);

  // ─── Admins ─────────────────────────────────────────────────────────────────
  async findAdminByUsername(username: string) { return findAdminByUsernameRaw(username); }
  async findAdminById(id: number | string)    { return findAdminByIdRaw(id); }

  // ─── Face Embeddings ────────────────────────────────────────────────────────
  async getFaceEmbeddings()              { return getFaceEmbeddingsRaw(); }
  async deleteFaceEmbedding(id: string)  { return deleteFaceEmbeddingRaw(id); }

  // ─── Attendance ─────────────────────────────────────────────────────────────
  async getAttendance()                       { return getAttendanceRaw(); }
  async getMyAttendance(empId?: string)       { return getMyAttendanceRaw(empId); }
  async getZoneLogs()                         { return getZoneLogsRaw(); }
  async getAttendanceStats()                  { return getAttendanceStatsRaw(); }
  async createAttendance(body: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(() => insertAttendanceRecordRaw(body), 'DB_ERROR');
  }

  // ─── Papka Orders / Machine Tasks ───────────────────────────────────────────
  async getPapkaOrders(opts?: Parameters<typeof getPapkaOrdersRaw>[0])    { return getPapkaOrdersRaw(opts); }
  async createPapkaOrder(params: Parameters<typeof createPapkaOrderRaw>[0]) { return createPapkaOrderRaw(params); }
  async updatePapkaOrder(id: string, updates: Parameters<typeof updatePapkaOrderRaw>[1]) { return updatePapkaOrderRaw(id, updates); }
  async getMachineTasks()                                                { return getMachineTasksRaw(); }
  async createMachineTask(params: Parameters<typeof createMachineTaskRaw>[0]) { return createMachineTaskRaw(params); }
  async getPlanningOperations()                                          { return getPlanningOperationsRaw(); }
  async createPlanningOperation(params: Parameters<typeof createPlanningOperationRaw>[0]) { return createPlanningOperationRaw(params); }
  async getKanbanEmployees()                                             { return getKanbanEmployeesRaw(); }

  // ─── Warehouse ──────────────────────────────────────────────────────────────
  // NOTE: orders-by-date route removed — handled by WmsCatalogController (wms module, papka_orders JOIN material_kits)
  async getWarehouseList()                      { return getWarehouseListRaw(); }
  async getWarehouseStock(warehouseId?: string) { return getWarehouseStockRaw(warehouseId); }
  async getWarehouseTransfers()                 { return getWarehouseTransfersRaw(); }
  async getWarehouseLots()                      { return getWarehouseLotsRaw(); }
  async getWarehouseInternalRequests()          { return getWarehouseInternalRequestsRaw(); }
  async getWarehouseDashboardKpis()             { return getWarehouseDashboardKpisRaw(); }
  async getWarehouseOccupancy()                 { return getWarehouseOccupancyRaw(); }

  // ─── Finance / KPI ──────────────────────────────────────────────────────────
  async getSalaryBenchmark()    { return getSalaryBenchmarkRaw(); }
  async getResourceAllocation() { return getResourceAllocationRaw(); }

  // ─── Certificates / Safety / Discipline ─────────────────────────────────────
  async getCertificatesUser(empId?: string)     { return getCertificatesUserRaw(empId); }
  async getSafetyViolationsUser(empId?: string) { return getSafetyViolationsUserRaw(empId); }
  async getDisciplineUser(empId?: string)       { return getDisciplineUserRaw(empId); }
}
