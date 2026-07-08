/**
 * test/pos/pos-movement.service.photo-evidence.spec.ts
 *
 * VISION-3340 #60 (WMS / POS-Monitor): the live column `pos_movements.photo_evidence_url` was
 * ONLY ever written for `pos_shift_handovers` — the movement-create flow never persisted it.
 * It is now wired end-to-end: CreateMovementSchema.photoEvidenceUrl → PosMovementService
 * .createMovement → repo.insertMovement({ photoEvidenceUrl }) → Drizzle `.values()` →
 * photo_evidence_url (mirrors the shift-handover pattern; z.string().max(2048).optional()).
 *
 * This spec captures the insert-object createMovement hands to the repo (repo.insertMovement is
 * mocked) and proves BOTH cases: (1) a provided URL threads through unchanged; (2) an omitted URL
 * inserts NULL — no fabrication (Q-40). Mocking technique mirrors
 * test/pos/pos-movement.service.exchange-rate.spec.ts (the existing pos-movement service spec).
 */

// PosMovementService transitively imports LifecycleBlockService -> pos-lifecycle-block.repository.ts
// -> @workspace/db, which eagerly opens a real Pool() and throws without DATABASE_URL. As in the
// exchange-rate spec we only exercise createMovement's happy path (repo + audit/emitter/bus), so we
// stub the DB module out entirely rather than requiring a live DB.
jest.mock('../../../../lib/db/dist/cjs/index.js', () => ({ db: {}, eq: jest.fn(), sql: jest.fn() }), { virtual: true });
jest.mock('@workspace/db', () => ({ db: {}, eq: jest.fn(), sql: jest.fn() }));
// Document-number helper hits the real DB (SEQ_BY_PREFIX). createMovement's numbering path calls
// nextDocNumber() for a KOCHIRISH movement — stub it so numbering never touches a live DB.
jest.mock('@common/database/doc-sequences.helper', () => ({
  nextDocNumber:          jest.fn(async () => 'KOCHIRISH-AKT-2026-000001'),
  nextWarehouseDocNumber: jest.fn(async () => 'RM-MAIN-KOCHIRISH-2026-00001'),
}));

import { PosMovementService } from '../../src/modules/pos/application/services/pos-movement.service';
import { Ok } from '../../src/common/result';
import type { IPosMovementRepository } from '../../src/modules/pos/domain/repositories/i-pos-movement.repo';
import type { CreateMovementDto } from '../../src/modules/pos/dto/movement.dto';

/** Only the fields this spec asserts on; the real insert row has many more. */
type CapturedInsert = {
  photoEvidenceUrl?: string | null; notes?: string | null;
  supplierName?: string | null; documentNumber?: string | null; documentDate?: string | null;
};

function makeRepoMock() {
  return {
    // INTERNAL_TRANSFER (KOCHIRISH): not EXTERNAL_IN / not INTERNAL_RETURN, and with no lines +
    // no warehouse every stock/barcode/reservation gate is skipped — a minimal happy path.
    findMovementTypeByCode: jest.fn().mockResolvedValue(Ok({ id: 5, code: 'INTERNAL_TRANSFER' })),
    countMovements:         jest.fn().mockResolvedValue(Ok(0)),
    insertMovement:         jest.fn().mockResolvedValue(Ok({ id: 123, movementNumber: 'KOCHIRISH-AKT-2026-000001' })),
  };
}

// createMovement also calls audit.log / eventEmitter.emit / eventBus.publish on success — real
// mocks (not empty stubs) so those calls do not throw. i18n is only hit on error branches.
const mockAudit   = { log: jest.fn().mockResolvedValue(undefined) } as never;
const mockEmitter = { emit: jest.fn() } as never;
const mockBus     = { publish: jest.fn() } as never;
const mockI18n    = { t: jest.fn(async (k: string) => k) } as never;
const UNUSED      = {} as never;

function makeService(repo: ReturnType<typeof makeRepoMock>): PosMovementService {
  // constructor order: (lifecycleBlock, stockReservation, employeeLedger, auditService,
  //   balanceGuard, techCardGate, varianceConfig, eventEmitter, eventBus, repo, i18n)
  return new PosMovementService(
    UNUSED, UNUSED, UNUSED, mockAudit, UNUSED, UNUSED, UNUSED,
    mockEmitter, mockBus, repo as unknown as IPosMovementRepository, mockI18n,
  );
}

describe('PosMovementService.createMovement() — VISION-3340 #60 photo_evidence_url wiring', () => {
  let repo: ReturnType<typeof makeRepoMock>;
  let svc: PosMovementService;

  beforeEach(() => {
    repo = makeRepoMock();
    svc = makeService(repo);
  });

  it('threads a provided photoEvidenceUrl into the movement insert object', async () => {
    const url = 'https://cdn.europrint.local/evidence/kirim-123.jpg';
    const r = await svc.createMovement(
      { movementTypeCode: 'INTERNAL_TRANSFER', photoEvidenceUrl: url } as unknown as CreateMovementDto,
      1,
    );
    expect(r.ok).toBe(true);
    expect(repo.insertMovement).toHaveBeenCalledTimes(1);
    const insertArg = repo.insertMovement.mock.calls[0][0] as CapturedInsert;
    expect(insertArg.photoEvidenceUrl).toBe(url);
  });

  it('inserts NULL for photo_evidence_url when no URL is provided (no fabrication)', async () => {
    const r = await svc.createMovement(
      { movementTypeCode: 'INTERNAL_TRANSFER' } as unknown as CreateMovementDto,
      1,
    );
    expect(r.ok).toBe(true);
    expect(repo.insertMovement).toHaveBeenCalledTimes(1);
    const insertArg = repo.insertMovement.mock.calls[0][0] as CapturedInsert;
    expect(insertArg.photoEvidenceUrl).toBeNull();
  });
});

describe('PosMovementService.createMovement() — KIRIM receipt header (supplier/document)', () => {
  let repo: ReturnType<typeof makeRepoMock>;
  let svc: PosMovementService;

  beforeEach(() => {
    repo = makeRepoMock();
    svc = makeService(repo);
  });

  it('threads supplierName + documentNumber + documentDate (YYYY-MM-DD) into the insert (were dropped)', async () => {
    const r = await svc.createMovement(
      {
        movementTypeCode: 'INTERNAL_TRANSFER',
        supplierName: 'Test Yetkazuvchi AJ', documentNumber: 'C-1', documentDate: '2026-07-08T00:00:00Z',
      } as unknown as CreateMovementDto,
      1,
    );
    expect(r.ok).toBe(true);
    const insertArg = repo.insertMovement.mock.calls[0][0] as CapturedInsert;
    expect(insertArg.supplierName).toBe('Test Yetkazuvchi AJ');
    expect(insertArg.documentNumber).toBe('C-1');
    expect(insertArg.documentDate).toBe('2026-07-08'); // date column -> sliced to YYYY-MM-DD
  });

  it('inserts NULL for the header fields when none are provided (no fabrication)', async () => {
    const r = await svc.createMovement(
      { movementTypeCode: 'INTERNAL_TRANSFER' } as unknown as CreateMovementDto,
      1,
    );
    expect(r.ok).toBe(true);
    const insertArg = repo.insertMovement.mock.calls[0][0] as CapturedInsert;
    expect(insertArg.supplierName).toBeNull();
    expect(insertArg.documentNumber).toBeNull();
    expect(insertArg.documentDate).toBeNull();
  });
});
