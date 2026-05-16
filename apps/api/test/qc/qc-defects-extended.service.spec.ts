/**
 * test/qc/qc-defects-extended.service.spec.ts
 *
 * QcDefectsExtendedService — passthrough over QcDefectsExtendedRepository.
 * Tests verify that arguments are forwarded unchanged and Result is bubbled up.
 */

import { QcDefectsExtendedService } from '../../src/modules/qc/application/qc-defects-extended.service';
import { QcDefectsExtendedRepository } from '../../src/modules/qc/application/qc-defects-extended.repository';

function buildRepo(overrides: Partial<jest.Mocked<QcDefectsExtendedRepository>> = {}): jest.Mocked<QcDefectsExtendedRepository> {
  return {
    listBraks: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    getBrakStats: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    getBrakCostImpact: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    createBrak: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    listSupplierQuality: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    createSupplierQuality: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    getDashboardStats: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    getDashboardFlow: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    listApprovals: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    createApproval: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    updateApproval: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    updateReclamation: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    ...overrides,
  } as unknown as jest.Mocked<QcDefectsExtendedRepository>;
}

describe('QcDefectsExtendedService', () => {
  it('listBraks forwards optional session id, limit and offset', async () => {
    const repo = buildRepo();
    const svc = new QcDefectsExtendedService(repo);

    await svc.listBraks(7, 25, 50);

    expect(repo.listBraks).toHaveBeenCalledWith(7, 25, 50);
  });

  it('listBraks passes null sid when no filter', async () => {
    const repo = buildRepo();
    const svc = new QcDefectsExtendedService(repo);

    await svc.listBraks(null, 10, 0);

    expect(repo.listBraks).toHaveBeenCalledWith(null, 10, 0);
  });

  it('getBrakStats forwards from/to filters', async () => {
    const repo = buildRepo({
      getBrakStats: jest.fn().mockResolvedValue({ ok: true, data: { total_braks: 12 } }),
    });
    const svc = new QcDefectsExtendedService(repo);

    const r = await svc.getBrakStats('2026-01-01', '2026-01-31');

    expect(repo.getBrakStats).toHaveBeenCalledWith('2026-01-01', '2026-01-31');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ total_braks: 12 });
  });

  it('createBrak forwards every positional argument intact', async () => {
    const repo = buildRepo();
    const svc = new QcDefectsExtendedService(repo);

    await svc.createBrak(11, 22, 5, 'misprint', 3, 9, 88);

    expect(repo.createBrak).toHaveBeenCalledWith(11, 22, 5, 'misprint', 3, 9, 88);
  });

  it('listApprovals forwards type and status filters', async () => {
    const repo = buildRepo();
    const svc = new QcDefectsExtendedService(repo);

    await svc.listApprovals('reclamation', 'pending');

    expect(repo.listApprovals).toHaveBeenCalledWith('reclamation', 'pending');
  });

  it('updateReclamation forwards all four parameters', async () => {
    const repo = buildRepo();
    const svc = new QcDefectsExtendedService(repo);

    await svc.updateReclamation(5, 'resolved', 'rework completed', 7);

    expect(repo.updateReclamation).toHaveBeenCalledWith(5, 'resolved', 'rework completed', 7);
  });
});
