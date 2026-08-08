/**
 * Smoke spec for LegacyService (Rule 22: every service needs a unit test).
 *
 * LegacyService is a pure facade (see legacy.service.ts header, "Rule 16:
 * This service is a facade") — every public method is a one-line delegation
 * to a raw-SQL helper in legacy-attendance.helpers.ts / legacy-warehouse.helpers.ts,
 * which in turn hit `@shared/db` (real Drizzle pgTable query builders, not a
 * simple rawSql/runQuery pair). There is no pure/testable logic on the class
 * itself, so — per the barcode-warehouse-queries.service.spec.ts precedent —
 * this smoke spec only verifies the class is importable and shaped as expected;
 * behavioural coverage of the underlying SQL belongs with a DB-backed
 * integration test for the helper modules, not a unit spec for this facade.
 */
import { LegacyService } from '../../src/modules/general/services/legacy.service';

describe('LegacyService', () => {
  it('is defined', () => {
    expect(LegacyService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(LegacyService.name).toBe('LegacyService');
  });

  it('exposes the expected public facade methods', () => {
    const proto = LegacyService.prototype;
    const facadeMethods = [
      'findAdminByUsername', 'findAdminById',
      'getFaceEmbeddings', 'deleteFaceEmbedding',
      'getAttendance', 'getMyAttendance', 'getZoneLogs', 'getAttendanceStats', 'createAttendance',
      'getPapkaOrders', 'createPapkaOrder', 'updatePapkaOrder',
      'getMachineTasks', 'createMachineTask',
      'getPlanningOperations', 'createPlanningOperation', 'getKanbanEmployees',
      'getWarehouseList', 'getWarehouseStock', 'getWarehouseTransfers', 'getWarehouseLots',
      'getWarehouseInternalRequests', 'getWarehouseDashboardKpis', 'getWarehouseOccupancy',
      'getSalaryBenchmark', 'getResourceAllocation',
      'getCertificatesUser', 'getSafetyViolationsUser', 'getDisciplineUser',
    ];
    for (const method of facadeMethods) {
      expect(typeof (proto as Record<string, unknown>)[method]).toBe('function');
    }
  });
});
