/**
 * test/pp/routings.service.spec.ts
 *
 * RoutingsService wraps IPpRoutingsRepository. findOne loads operations as a
 * side effect; findAll wraps results in a pagination envelope; missing
 * routings produce NotFoundException.
 */

import { NotFoundException } from '@nestjs/common';
import { RoutingsService } from '../../src/modules/pp/routings/routings.service';
import type { IPpRoutingsRepository } from '../../src/modules/pp/routings/i-pp-routings.repo';

function buildRepo(overrides: Partial<jest.Mocked<IPpRoutingsRepository>> = {}): jest.Mocked<IPpRoutingsRepository> {
  return {
    findAll: jest.fn().mockResolvedValue({ ok: true, data: { data: [], count: 0 } }),
    findById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    findOperationsByRoutingId: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    create: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    update: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    softDelete: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    ...overrides,
  };
}

describe('RoutingsService', () => {
  it('findAll applies default pagination of 10 per page', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue({ ok: true, data: { data: [{ id: 1 }], count: 1 } }),
    });
    const svc = new RoutingsService(repo);

    const r = await svc.findAll({});

    expect(r.ok).toBe(true);
    expect(repo.findAll).toHaveBeenCalledWith(10, 0);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ pagination: { page: 1, limit: 10, total: 1 } });
  });

  it('findOne merges operations under the routing header', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 11, name: 'R-11' } }),
      findOperationsByRoutingId: jest.fn().mockResolvedValue({ ok: true, data: [{ seq: 1 }, { seq: 2 }] }),
    });
    const svc = new RoutingsService(repo);

    const r = await svc.findOne(11);

    expect(r).toMatchObject({ id: 11, name: 'R-11', operations: [{ seq: 1 }, { seq: 2 }] });
    expect(repo.findOperationsByRoutingId).toHaveBeenCalledWith('11');
  });

  it('findOne throws NotFoundException when header is null', async () => {
    const repo = buildRepo();
    const svc = new RoutingsService(repo);

    await expect(svc.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create forwards the dto and returns the new row', async () => {
    const repo = buildRepo({
      create: jest.fn().mockResolvedValue({ ok: true, data: { id: 5, name: 'New routing' } }),
    });
    const svc = new RoutingsService(repo);

    const r = await svc.create({ name: 'New routing' });

    expect(repo.create).toHaveBeenCalledWith({ name: 'New routing' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((r.data as { id: number }).id).toBe(5);
  });

  it('update verifies existence before delegating to repo.update', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 3 } }),
    });
    const svc = new RoutingsService(repo);

    await svc.update(3, { name: 'renamed' });

    expect(repo.findById).toHaveBeenCalledWith(3);
    expect(repo.update).toHaveBeenCalledWith(3, { name: 'renamed' });
  });
});
