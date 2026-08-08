/**
 * test/qc/submit-inspection.handler.spec.ts
 *
 * Unit tests for SubmitInspectionHandler. IQcRepository + EventBus mocked.
 * Real Inspection aggregate is used.
 *
 * VISION-3340 #37 (2026-07-08): `@shared/db` is also mocked (same pattern as
 * this directory's get-inspection-stats.handler.spec.ts / the sibling
 * test/iot/anomaly-detected.handler.spec.ts) so the new
 * checkFinalSignoffRazryadGate() DB lookup is fully deterministic — no real
 * Postgres pool needed. The pre-existing tests above never reach db.execute
 * because they use the aggregate's synthetic UUID id (non-numeric — the gate
 * short-circuits to Ok before querying), so mocking @shared/db does not
 * change their behaviour.
 */

jest.mock('@shared/db', () => ({
  db: { execute: jest.fn() },
}));

import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { db } from '@shared/db';
import { SubmitInspectionHandler } from '../../src/modules/qc/application/commands/submit-inspection.handler';
import { SubmitInspectionCommand } from '../../src/modules/qc/application/commands/submit-inspection.command';
import { Inspection } from '../../src/modules/qc/domain/aggregates/inspection.aggregate';
import { InspectionStatus } from '../../src/modules/qc/domain/enums/inspection-status.enum';
import {
  QcPassedEvent,
  QcFailedEvent,
  SupplierQualityFailEvent,
} from '../../src/modules/qc/domain/events';
import { IQcRepository, QC_REPOSITORY_PROVIDER } from '../../src/modules/qc/application/repositories/qc.repository';
import { inspectionFactory } from '../_fixtures/factories';
import {
  QC_FINAL_INSPECTION_REFERENCE_TYPE,
  QC_FINAL_SIGNOFF_MIN_RAZRYAD_LEVEL,
} from '../../src/common/constants/business.constants';

const mockDbExecute = db.execute as jest.Mock;

type RepoMock = {
  save: jest.Mock<Promise<void>, [Inspection]>;
  findById: jest.Mock<Promise<Inspection | null>, [string]>;
  findByOrderId: jest.Mock;
  delete: jest.Mock;
  withTransaction: jest.Mock;
};

function makeRepo(): RepoMock {
  const repo: RepoMock = {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    findByOrderId: jest.fn(),
    delete: jest.fn(),
    withTransaction: jest.fn(),
  };
  repo.withTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(null));
  return repo;
}

function makeInspection(): Inspection {
  const f = inspectionFactory();
  return Inspection.create(f.orderId, f.batchId, f.inspectorId, f.sampleSize);
}

describe('SubmitInspectionHandler', () => {
  let handler: SubmitInspectionHandler;
  let repo: RepoMock;
  let eventBus: { publish: jest.Mock };

  beforeEach(async () => {
    repo = makeRepo();
    eventBus = { publish: jest.fn() };
    mockDbExecute.mockReset().mockResolvedValue({ rows: [] });
    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmitInspectionHandler,
        { provide: QC_REPOSITORY_PROVIDER, useValue: repo },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();
    handler = moduleRef.get(SubmitInspectionHandler);
  });

  it('returns NOT_FOUND when inspection does not exist', async () => {
    repo.findById.mockResolvedValueOnce(null);

    const r = await handler.execute(new SubmitInspectionCommand('insp-x', 1, true, ''));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('marks inspection passed and publishes QcPassedEvent when command.passed=true', async () => {
    const insp = makeInspection();
    repo.findById.mockResolvedValueOnce(insp);

    const r = await handler.execute(new SubmitInspectionCommand(insp.id, 7, true, ''));

    expect(r.ok).toBe(true);
    expect(insp.status).toBe(InspectionStatus.PASSED);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish.mock.calls[0][0]).toBeInstanceOf(QcPassedEvent);
  });

  it('marks inspection failed and publishes QcFailedEvent when command.passed=false', async () => {
    const insp = makeInspection();
    repo.findById.mockResolvedValueOnce(insp);

    await handler.execute(new SubmitInspectionCommand(insp.id, 7, false, 'damaged'));

    expect(insp.status).toBe(InspectionStatus.FAILED);
    const evt = eventBus.publish.mock.calls[0][0];
    expect(evt).toBeInstanceOf(QcFailedEvent);
    expect((evt as QcFailedEvent).reason).toBe('damaged');
  });

  it('additionally publishes SupplierQualityFailEvent when supplierId is provided on a fail', async () => {
    const insp = makeInspection();
    repo.findById.mockResolvedValueOnce(insp);

    await handler.execute(new SubmitInspectionCommand(insp.id, 7, false, 'late', 42));

    expect(eventBus.publish).toHaveBeenCalledTimes(2);
    expect(eventBus.publish.mock.calls[1][0]).toBeInstanceOf(SupplierQualityFailEvent);
  });

  it('persists the inspection through repository.save on success', async () => {
    const insp = makeInspection();
    repo.findById.mockResolvedValueOnce(insp);

    const r = await handler.execute(new SubmitInspectionCommand(insp.id, 7, true, ''));

    expect(repo.save).toHaveBeenCalledWith(insp, null);
    if (r.ok) expect(r.data).toBe(insp.id);
  });
});

describe('SubmitInspectionHandler — final QC razryad sign-off gate (VISION-3340 #37)', () => {
  let handler: SubmitInspectionHandler;
  let repo: RepoMock;
  let eventBus: { publish: jest.Mock };

  beforeEach(async () => {
    repo = makeRepo();
    eventBus = { publish: jest.fn() };
    mockDbExecute.mockReset().mockResolvedValue({ rows: [] });
    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmitInspectionHandler,
        { provide: QC_REPOSITORY_PROVIDER, useValue: repo },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();
    handler = moduleRef.get(SubmitInspectionHandler);
  });

  it('does not query the DB when inspectionId is a non-numeric (synthetic aggregate) id', async () => {
    const insp = makeInspection();
    repo.findById.mockResolvedValueOnce(insp);

    const r = await handler.execute(new SubmitInspectionCommand(insp.id, 7, true, ''));

    expect(r.ok).toBe(true);
    expect(mockDbExecute).not.toHaveBeenCalled();
  });

  it('does not block a non-final inspection regardless of inspector razryad', async () => {
    const insp = makeInspection();
    repo.findById.mockResolvedValueOnce(insp);
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ reference_type: 'batch', inspector_razryad_level: null }],
    });

    const r = await handler.execute(new SubmitInspectionCommand('42', 7, true, ''));

    expect(r.ok).toBe(true);
    expect(insp.status).toBe(InspectionStatus.PASSED);
    expect(repo.save).toHaveBeenCalledWith(insp, null);
  });

  it('blocks a final sign-off with BUSINESS_RULE_VIOLATION when the inspector razryad is below the minimum', async () => {
    const insp = makeInspection();
    repo.findById.mockResolvedValueOnce(insp);
    mockDbExecute.mockResolvedValueOnce({
      rows: [{
        reference_type: QC_FINAL_INSPECTION_REFERENCE_TYPE,
        inspector_razryad_level: QC_FINAL_SIGNOFF_MIN_RAZRYAD_LEVEL - 1,
      }],
    });

    const r = await handler.execute(new SubmitInspectionCommand('42', 7, true, ''));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
    expect(repo.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('blocks a final sign-off when the inspector has no card/razryad linked (null level)', async () => {
    const insp = makeInspection();
    repo.findById.mockResolvedValueOnce(insp);
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ reference_type: QC_FINAL_INSPECTION_REFERENCE_TYPE, inspector_razryad_level: null }],
    });

    const r = await handler.execute(new SubmitInspectionCommand('42', 7, true, ''));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('allows a final sign-off when the inspector razryad meets the minimum exactly (inclusive boundary)', async () => {
    const insp = makeInspection();
    repo.findById.mockResolvedValueOnce(insp);
    mockDbExecute.mockResolvedValueOnce({
      rows: [{
        reference_type: QC_FINAL_INSPECTION_REFERENCE_TYPE,
        inspector_razryad_level: QC_FINAL_SIGNOFF_MIN_RAZRYAD_LEVEL,
      }],
    });

    const r = await handler.execute(new SubmitInspectionCommand('42', 7, true, ''));

    expect(r.ok).toBe(true);
    expect(insp.status).toBe(InspectionStatus.PASSED);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish.mock.calls[0][0]).toBeInstanceOf(QcPassedEvent);
  });

  it('returns INTERNAL and blocks the sign-off when the razryad lookup query itself fails', async () => {
    const insp = makeInspection();
    repo.findById.mockResolvedValueOnce(insp);
    mockDbExecute.mockRejectedValueOnce(new Error('connection lost'));

    const r = await handler.execute(new SubmitInspectionCommand('42', 7, true, ''));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INTERNAL');
    expect(repo.save).not.toHaveBeenCalled();
  });
});
