/**
 * test/qc/qc-aql-endpoints.spec.ts
 *
 * Unit tests for the two AQL endpoints wired in QcNewController.
 *
 * Strategy: test the controller methods directly (not via Supertest / NestJS
 * testing module) so we avoid the full DI graph.  We mock:
 *   - @workspace/db  — prevents DATABASE_URL check at module load time
 *   - @shared/db     — prevents Drizzle pool creation
 *   - QcAqlService   — real instance (pure compute, no deps)
 *   - QcNewService.getInspectionById — returns a mock DB row
 *   - SpcService     — not exercised; passed as null stub
 *
 * No real DB calls are made (touchedLibDb = false).
 * No JWT/auth logic is exercised (guards are not mounted in unit tests).
 */

// ── Mock DB layer (must precede any import that transitively touches DB) ─────
jest.mock('@workspace/db', () => ({
  drizzle: jest.fn(),
  pgTable: jest.fn(),
}));

jest.mock('@shared/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    execute: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
  qc_inspections: { id: 'id', items_checked: 'items_checked', status: 'status' },
  qc_checkpoints: {},
  qc_certificates: {},
  qc_lab_tests: {},
  qc_spc_data: {},
  qc_parameters: {},
  qc_defects: {},
  qc_supplier_quality: {},
  mm_vendors: {},
  auditLogs: {},
  runQuery: jest.fn(),
  sql: jest.fn(),
}));

// Also mock the schema-rbac re-export that audit.interceptor imports directly
jest.mock('@shared/db/schema-rbac', () => ({
  auditLogs: {},
  users: {},
}));

// Mock drizzle-orm so eq / desc / sql don't blow up on the mocked tables
jest.mock('drizzle-orm', () => ({
  eq: jest.fn().mockReturnValue({}),
  ne: jest.fn().mockReturnValue({}),
  desc: jest.fn().mockReturnValue({}),
  sql: jest.fn().mockReturnValue({}),
  and: jest.fn().mockReturnValue({}),
  or: jest.fn().mockReturnValue({}),
  gte: jest.fn().mockReturnValue({}),
  isNull: jest.fn().mockReturnValue({}),
}));

// ─────────────────────────────────────────────────────────────────────────────

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QcNewController } from '../../src/modules/qc/presentation/qc-new.controller';
import { QcAqlService } from '../../src/modules/qc/domain/services/qc-aql.service';
import { QcNewService } from '../../src/modules/qc/application/qc-new.service';
import { SpcService } from '../../src/modules/qc/domain/services/spc.service';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Build a real QcAqlService (pure compute — no constructor deps). */
function makeAqlService(): QcAqlService {
  return new QcAqlService();
}

/**
 * Minimal QcNewService stub — only getInspectionById is exercised here.
 * Pass 'error' to simulate a DB-level failure.
 */
function makeQcNewServiceStub(
  inspectionRow: Record<string, unknown> | null | 'error',
): jest.Mocked<Pick<QcNewService, 'getInspectionById'>> {
  return {
    getInspectionById: jest.fn().mockResolvedValue(
      inspectionRow === 'error'
        ? { ok: false, error: { code: 'DB_ERROR', message: 'db fail' } }
        : { ok: true, data: inspectionRow },
    ),
  };
}

function makeController(
  svcStub: Pick<QcNewService, 'getInspectionById'>,
  aqlSvc: QcAqlService,
): QcNewController {
  return new QcNewController(
    svcStub as unknown as QcNewService,
    null as unknown as SpcService,
    aqlSvc,
  );
}

// ─── GET /qc/aql/plan ────────────────────────────────────────────────────────

describe('QcNewController.getAqlPlan (GET /qc/aql/plan)', () => {
  let ctrl: QcNewController;

  beforeEach(() => {
    ctrl = makeController(makeQcNewServiceStub(null), makeAqlService());
  });

  it('returns the correct plan for lotSize=500, defaults (AQL 2.5, Level II)', () => {
    // lot 281–500 → code H, n=50, Ac=3, Re=4  [ISO 2859-1 Table 1+2A]
    const result = ctrl.getAqlPlan({ lotSize: '500' });
    expect(result).toEqual({ codeLetter: 'H', sampleSize: 50, accept: 3, reject: 4 });
  });

  it('returns correct plan for lotSize=5000, AQL 1.0, Level II', () => {
    // lot 3201–10000 → code L, n=200, Ac=5, Re=6  at AQL 1.0
    const result = ctrl.getAqlPlan({ lotSize: '5000', aql: '1.0', level: 'II' });
    expect(result).toEqual({ codeLetter: 'L', sampleSize: 200, accept: 5, reject: 6 });
  });

  it('returns correct plan for lotSize=200, Level III', () => {
    // lot 151–280, Level III → code H, n=50, Ac=3, Re=4
    const result = ctrl.getAqlPlan({ lotSize: '200', level: 'III' });
    expect(result).toEqual({ codeLetter: 'H', sampleSize: 50, accept: 3, reject: 4 });
  });

  it('throws BadRequestException for missing lotSize', () => {
    expect(() => ctrl.getAqlPlan({})).toThrow(BadRequestException);
  });

  it('throws BadRequestException for lotSize = 0', () => {
    expect(() => ctrl.getAqlPlan({ lotSize: '0' })).toThrow(BadRequestException);
  });

  it('throws BadRequestException for lotSize = 1 (below ISO minimum of 2)', () => {
    // AQL service returns VALIDATION Err → controller maps to 400
    expect(() => ctrl.getAqlPlan({ lotSize: '1' })).toThrow(BadRequestException);
  });

  it('throws BadRequestException for fractional lotSize', () => {
    expect(() => ctrl.getAqlPlan({ lotSize: '100.5' })).toThrow(BadRequestException);
  });

  it('throws BadRequestException for invalid aql value (3.0 is not in the set)', () => {
    expect(() => ctrl.getAqlPlan({ lotSize: '500', aql: '3.0' })).toThrow(BadRequestException);
  });

  it('throws BadRequestException for invalid inspection level (IV)', () => {
    expect(() => ctrl.getAqlPlan({ lotSize: '500', level: 'IV' })).toThrow(BadRequestException);
  });

  it('invariant: reject === accept + 1 for a valid lot', () => {
    const result = ctrl.getAqlPlan({ lotSize: '1200' }) as { accept: number; reject: number };
    expect(result.reject).toBe(result.accept + 1);
  });
});

// ─── GET /qc/inspections/:id/aql-plan ────────────────────────────────────────

describe('QcNewController.getInspectionAqlPlan (GET /qc/inspections/:id/aql-plan)', () => {
  const aqlSvc = makeAqlService();

  it('returns plan derived from the inspection\'s items_checked (lot size)', async () => {
    // items_checked = 500 → code H, AQL 2.5 → Ac=3, Re=4
    const svcStub = makeQcNewServiceStub({ id: '42', items_checked: 500, status: 'pending' });
    const ctrl = makeController(svcStub, aqlSvc);

    const result = await ctrl.getInspectionAqlPlan('42', {});
    expect(result).toMatchObject({
      inspectionId: '42',
      lotSize: 500,
      aql: 2.5,
      level: 'II',
      plan: { codeLetter: 'H', sampleSize: 50, accept: 3, reject: 4 },
    });
    expect(svcStub.getInspectionById).toHaveBeenCalledWith('42');
  });

  it('respects aql and level overrides from query string', async () => {
    // items_checked = 500, Level I → code F, n=20, Ac=1, Re=2
    const svcStub = makeQcNewServiceStub({ id: '7', items_checked: 500, status: 'pending' });
    const ctrl = makeController(svcStub, aqlSvc);

    const result = await ctrl.getInspectionAqlPlan('7', { aql: '2.5', level: 'I' });
    expect(result).toMatchObject({
      lotSize: 500,
      level: 'I',
      plan: { codeLetter: 'F', sampleSize: 20, accept: 1, reject: 2 },
    });
  });

  it('throws NotFoundException when inspection row is null (row does not exist)', async () => {
    const ctrl = makeController(makeQcNewServiceStub(null), aqlSvc);
    await expect(ctrl.getInspectionAqlPlan('999', {})).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when items_checked = 0 (lot size not yet recorded)', async () => {
    const ctrl = makeController(makeQcNewServiceStub({ id: '1', items_checked: 0 }), aqlSvc);
    await expect(ctrl.getInspectionAqlPlan('1', {})).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when items_checked = 1 (below ISO minimum of 2)', async () => {
    const ctrl = makeController(makeQcNewServiceStub({ id: '2', items_checked: 1 }), aqlSvc);
    await expect(ctrl.getInspectionAqlPlan('2', {})).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when items_checked is null (graceful degrade — missing column)', async () => {
    const ctrl = makeController(makeQcNewServiceStub({ id: '3', items_checked: null }), aqlSvc);
    await expect(ctrl.getInspectionAqlPlan('3', {})).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when items_checked column is absent from row (graceful degrade)', async () => {
    // Row exists but contains no items_checked key at all
    const ctrl = makeController(makeQcNewServiceStub({ id: '4', status: 'pending' }), aqlSvc);
    await expect(ctrl.getInspectionAqlPlan('4', {})).rejects.toThrow(BadRequestException);
  });

  it('propagates DB error from service (InternalServerErrorException)', async () => {
    const ctrl = makeController(makeQcNewServiceStub('error'), aqlSvc);
    // DB_ERROR code → InternalServerErrorException via throwFromError
    await expect(ctrl.getInspectionAqlPlan('5', {})).rejects.toThrow();
  });

  it('throws BadRequestException for an invalid aql override query param', async () => {
    const svcStub = makeQcNewServiceStub({ id: '6', items_checked: 100 });
    const ctrl = makeController(svcStub, aqlSvc);
    await expect(ctrl.getInspectionAqlPlan('6', { aql: '99' })).rejects.toThrow(BadRequestException);
  });
});
