/**
 * test/qc/defects.service.spec.ts
 *
 * DefectsService — paginated brak/reclamation CRUD over IDefectsRepository.
 *   - findAllBraks emits totalPages alongside the standard envelope
 *   - findOneBrak surfaces NotFoundException as NOT_FOUND through safeCall
 */

import { DefectsService } from '../../src/modules/qc/defects/defects.service';
import type { IDefectsRepository } from '../../src/modules/qc/defects/i-defects.repo';

function buildRepo(overrides: Partial<jest.Mocked<IDefectsRepository>> = {}): jest.Mocked<IDefectsRepository> {
  return {
    findAllBraks: jest.fn().mockResolvedValue({ ok: true, data: { data: [], count: 0 } }),
    findBrakById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    getBrakStats: jest.fn().mockResolvedValue({ ok: true, data: { byStage: [], topReasons: [], pendingRework: 0 } }),
    findAllReclamations: jest.fn().mockResolvedValue({ ok: true, data: { data: [], count: 0 } }),
    createBrak: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    createReclamation: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    ...overrides,
  };
}

describe('DefectsService', () => {
  it('findAllBraks computes totalPages from count and limit', async () => {
    const repo = buildRepo({
      findAllBraks: jest.fn().mockResolvedValue({ ok: true, data: { data: [{ id: 1 }], count: 47 } }),
    });
    const svc = new DefectsService(repo);

    const r = await svc.findAllBraks({ page: 1, limit: 10 });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ pagination: { total: 47, page: 1, limit: 10, totalPages: 5 } });
  });

  it('findAllBraks uses default page=1 limit=10 when query empty', async () => {
    const repo = buildRepo();
    const svc = new DefectsService(repo);

    await svc.findAllBraks();

    expect(repo.findAllBraks).toHaveBeenCalledWith(10, 0);
  });

  it('findOneBrak returns the row when present', async () => {
    const repo = buildRepo({
      findBrakById: jest.fn().mockResolvedValue({ ok: true, data: { id: 7, reason: 'misprint' } }),
    });
    const svc = new DefectsService(repo);

    const r = await svc.findOneBrak(7);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ id: 7 });
  });

  it('findOneBrak surfaces NOT_FOUND error when row is null', async () => {
    const repo = buildRepo({
      findBrakById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    });
    const svc = new DefectsService(repo);

    const r = await svc.findOneBrak(999);

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NOT_FOUND');
  });

  it('getBrakStats returns aggregated stats from the repository', async () => {
    const repo = buildRepo({
      getBrakStats: jest.fn().mockResolvedValue({
        ok: true,
        data: { byStage: [{ stage: 'printing', count: 5 }], topReasons: [], pendingRework: 2 },
      }),
    });
    const svc = new DefectsService(repo);

    const r = await svc.getBrakStats();

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ pendingRework: 2 });
  });

  it('createReclamation forwards dto to the repository', async () => {
    const repo = buildRepo({
      createReclamation: jest.fn().mockResolvedValue({ ok: true, data: { id: 33 } }),
    });
    const svc = new DefectsService(repo);

    const r = await svc.createReclamation({ orderId: 100, reason: 'damage' });

    expect(repo.createReclamation).toHaveBeenCalledWith({ orderId: 100, reason: 'damage' });
    expect(r.ok).toBe(true);
  });
});
