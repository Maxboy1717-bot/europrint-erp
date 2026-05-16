/**
 * test/qc/qc-extended.service.spec.ts
 *
 * QcExtendedService — covers the inspection-status derivation rule
 *   defects=0           → passed
 *   defects/total > 5%  → failed
 *   otherwise           → conditional
 * Plus pure passthrough to QcExtendedRepository.
 */

import { QcExtendedService } from '../../src/modules/qc/application/qc-extended.service';
import { QcExtendedRepository } from '../../src/modules/qc/application/qc-extended.repository';

function buildRepo(overrides: Partial<jest.Mocked<QcExtendedRepository>> = {}): jest.Mocked<QcExtendedRepository> {
  return {
    listStandards: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    getStandard: jest.fn().mockResolvedValue({ ok: true, data: null }),
    createStandard: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    updateStandard: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    listFinalInspections: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    createFinalInspection: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    updateFinalInspection: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    getFinalOrders: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    completeFinalInspection: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    listInProcess: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    createInProcessInspection: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    listRootCauses: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    createRootCause: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    updateRootCause: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    ...overrides,
  } as unknown as jest.Mocked<QcExtendedRepository>;
}

describe('QcExtendedService.deriveInspectionStatus', () => {
  const repo = buildRepo();
  const svc = new QcExtendedService(repo);

  it("returns 'passed' when defects=0 regardless of total", () => {
    expect(svc.deriveInspectionStatus(100, 0)).toBe('passed');
    expect(svc.deriveInspectionStatus(0, 0)).toBe('passed');
  });

  it("returns 'failed' when defect ratio exceeds 5%", () => {
    expect(svc.deriveInspectionStatus(100, 10)).toBe('failed');
    expect(svc.deriveInspectionStatus(20, 2)).toBe('failed');
  });

  it("returns 'conditional' when defect ratio is non-zero but ≤5%", () => {
    expect(svc.deriveInspectionStatus(100, 3)).toBe('conditional');
    expect(svc.deriveInspectionStatus(100, 5)).toBe('conditional');
  });

  it("returns 'conditional' for total=0 with defects>0 (boundary case)", () => {
    expect(svc.deriveInspectionStatus(0, 1)).toBe('conditional');
  });
});

describe('QcExtendedService passthroughs', () => {
  it('listStandards forwards category, limit, offset', async () => {
    const repo = buildRepo();
    const svc = new QcExtendedService(repo);

    await svc.listStandards('color', 25, 0);

    expect(repo.listStandards).toHaveBeenCalledWith('color', 25, 0);
  });

  it('createInProcessInspection derives status before delegating', async () => {
    const repo = buildRepo();
    const svc = new QcExtendedService(repo);

    await svc.createInProcessInspection(1, 5, 'station-A', 100, 0, 'ok');

    expect(repo.createInProcessInspection).toHaveBeenCalledWith(
      1, 5, 'station-A', 100, 0, 'passed', 'ok',
    );
  });

  it('createInProcessInspection marks failed when defects ratio > 5%', async () => {
    const repo = buildRepo();
    const svc = new QcExtendedService(repo);

    await svc.createInProcessInspection(2, 5, 'station-B', 100, 20, null);

    expect(repo.createInProcessInspection).toHaveBeenCalledWith(
      2, 5, 'station-B', 100, 20, 'failed', null,
    );
  });

  it('completeFinalInspection forwards all five arguments', async () => {
    const repo = buildRepo();
    const svc = new QcExtendedService(repo);

    await svc.completeFinalInspection(10, 'OK', 'no notes', 0, true);

    expect(repo.completeFinalInspection).toHaveBeenCalledWith(10, 'OK', 'no notes', 0, true);
  });
});
