/**
 * test/qc/submit-inspection.handler.spec.ts
 *
 * Unit tests for SubmitInspectionHandler. IQcRepository + EventBus mocked.
 * Real Inspection aggregate is used.
 */

import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
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

type RepoMock = {
  save: jest.Mock<Promise<void>, [Inspection]>;
  findById: jest.Mock<Promise<Inspection | null>, [string]>;
  findByOrderId: jest.Mock;
  delete: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    findByOrderId: jest.fn(),
    delete: jest.fn(),
  };
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

    expect(repo.save).toHaveBeenCalledWith(insp);
    if (r.ok) expect(r.data).toBe(insp.id);
  });
});
