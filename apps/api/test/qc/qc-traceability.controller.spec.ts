/**
 * test/qc/qc-traceability.controller.spec.ts
 *
 * VISION-3340 #40 — GET /qc/traceability/:productionOrderId on QcNewController.
 *
 * Strategy (mirrors qc-aql-endpoints.spec.ts): test the controller method directly,
 * mocking the DB layer at module-load so no real Drizzle pool is created and no DI
 * graph is mounted. QcNewService is a stub; the controller is transport-only
 * (Rule 6) so it must parse the :id, delegate, and let unwrapOrInternal map the
 * Result — NOT_FOUND → 404 (NotFoundException).
 */

jest.mock('@workspace/db', () => ({ drizzle: jest.fn(), pgTable: jest.fn() }));

jest.mock('@shared/db', () => ({
  db: { select: jest.fn(), insert: jest.fn(), execute: jest.fn(), delete: jest.fn(), transaction: jest.fn() },
  qc_inspections: {}, qc_checkpoints: {}, qc_certificates: {}, qc_lab_tests: {},
  qc_spc_data: {}, qc_parameters: {}, qc_defects: {}, qc_supplier_quality: {}, mm_vendors: {},
  auditLogs: {}, runQuery: jest.fn(), sql: jest.fn(),
}));

jest.mock('@shared/db/schema-rbac', () => ({ auditLogs: {}, users: {} }));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn().mockReturnValue({}), ne: jest.fn().mockReturnValue({}), desc: jest.fn().mockReturnValue({}),
  sql: jest.fn().mockReturnValue({}), and: jest.fn().mockReturnValue({}), or: jest.fn().mockReturnValue({}),
  gte: jest.fn().mockReturnValue({}), isNull: jest.fn().mockReturnValue({}),
}));

import { NotFoundException } from '@nestjs/common';
import { QcNewController } from '../../src/modules/qc/presentation/qc-new.controller';
import { QcNewService } from '../../src/modules/qc/application/qc-new.service';

/** Build QcNewController with a stubbed QcNewService; unused deps are null stubs. */
function makeController(svc: Pick<QcNewService, 'getTraceability'>): QcNewController {
  return new QcNewController(
    svc as unknown as QcNewService,
    null as never,
    null as never,
    null as never,
  );
}

describe('QcNewController.getTraceability (GET /qc/traceability/:productionOrderId)', () => {
  it('parses the :id, delegates to the service, and returns the trace payload', async () => {
    const trace = {
      productionOrder: { id: 48, salesOrderId: 12 },
      salesOrder: { id: 12 },
      qcInspections: [{ id: 60, fgBatchRef: 'QC-60' }],
      productionSessions: [{ id: 35, fgBatchRef: 'MES-35' }],
      fgReceipts: [], currentStock: [], deliveries: [],
      missingHops: [{ hop: 'mm_goods_receipts -> production_orders', reason: 'no FK', group: 'B' }],
    };
    const svc = { getTraceability: jest.fn().mockResolvedValue({ ok: true, data: trace }) };
    const ctrl = makeController(svc);

    const out = await ctrl.getTraceability('48');

    expect(svc.getTraceability).toHaveBeenCalledWith(48);
    expect(out).toBe(trace);
  });

  it('maps a NOT_FOUND Result to HTTP 404 (NotFoundException)', async () => {
    const svc = {
      getTraceability: jest.fn().mockResolvedValue({
        ok: false, error: { code: 'NOT_FOUND', message: 'Production order 999 topilmadi' },
      }),
    };
    const ctrl = makeController(svc);

    await expect(ctrl.getTraceability('999')).rejects.toBeInstanceOf(NotFoundException);
    expect(svc.getTraceability).toHaveBeenCalledWith(999);
  });
});
