/**
 * test/pp/work-centers.service.spec.ts
 *
 * WorkCentersService is a passthrough over IPpWorkCentersRepository.
 * Notable behaviours: existence check before update/remove, NotFoundException
 * for missing IDs, stats helper.
 */

import { NotFoundException } from '@nestjs/common';
import { WorkCentersService } from '../../src/modules/pp/work-centers/work-centers.service';
import type { IPpWorkCentersRepository } from '../../src/modules/pp/work-centers/i-pp-work-centers.repo';

function buildRepo(overrides: Partial<jest.Mocked<IPpWorkCentersRepository>> = {}): jest.Mocked<IPpWorkCentersRepository> {
  return {
    findAll: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    findById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    getStats: jest.fn().mockResolvedValue({ ok: true, data: { total: 0, active: 0, byType: [] } }),
    create: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    update: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    softDelete: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    ...overrides,
  };
}

describe('WorkCentersService', () => {
  it('findAll returns repository payload verbatim wrapped in Result', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue({ ok: true, data: [{ id: 1, name: 'Press' }] }),
    });
    const svc = new WorkCentersService(repo);

    const r = await svc.findAll();

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual([{ id: 1, name: 'Press' }]);
  });

  it('findOne returns the entity when present', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 4, name: 'Cutter' } }),
    });
    const svc = new WorkCentersService(repo);

    const row = await svc.findOne(4);

    expect(row).toEqual({ id: 4, name: 'Cutter' });
  });

  it('findOne throws NotFoundException for an unknown id', async () => {
    const repo = buildRepo();
    const svc = new WorkCentersService(repo);

    await expect(svc.findOne(123)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getStats forwards to the repository getStats method', async () => {
    const stats = { total: 5, active: 4, byType: [{ type: 'press', count: 2 }] };
    const repo = buildRepo({
      getStats: jest.fn().mockResolvedValue({ ok: true, data: stats }),
    });
    const svc = new WorkCentersService(repo);

    const r = await svc.getStats();

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual(stats);
  });

  it('update verifies existence first before delegating', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 7 } }),
    });
    const svc = new WorkCentersService(repo);

    await svc.update(7, { name: 'renamed' });

    expect(repo.findById).toHaveBeenCalledWith(7);
    expect(repo.update).toHaveBeenCalledWith(7, { name: 'renamed' });
  });

  it('remove soft-deletes the record after existence check', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 2 } }),
    });
    const svc = new WorkCentersService(repo);

    const r = await svc.remove(2);

    expect(repo.softDelete).toHaveBeenCalledWith(2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({ message: "O'chirildi" });
  });
});
