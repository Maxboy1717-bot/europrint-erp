/**
 * test/pp/bom.service.spec.ts
 *
 * BomService delegates to IPpBomRepository and wraps repository errors with
 * InternalServerErrorException via the safeCall helper. Notable behaviours:
 *   - pagination defaults (page=1, limit=10)
 *   - findOne loads header + items in two repo calls
 *   - findOne throws NotFoundException when header is null (mapped to NOT_FOUND)
 */

import { NotFoundException } from '@nestjs/common';
import { BomService } from '../../src/modules/pp/bom/bom.service';
import type { IPpBomRepository } from '../../src/modules/pp/bom/i-pp-bom.repo';

function buildRepo(overrides: Partial<jest.Mocked<IPpBomRepository>> = {}): jest.Mocked<IPpBomRepository> {
  return {
    findAll: jest.fn().mockResolvedValue({ ok: true, data: { data: [], count: 0 } }),
    findById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    findItemsByBomId: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    create: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    update: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    approve: jest.fn().mockResolvedValue({ ok: true, data: { id: 1, approved: true } }),
    softDelete: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    ...overrides,
  };
}

describe('BomService', () => {
  it('findAll uses default pagination when query is empty', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue({ ok: true, data: { data: [{ id: 1 }, { id: 2 }], count: 2 } }),
    });
    const svc = new BomService(repo);

    const r = await svc.findAll({});

    expect(r.ok).toBe(true);
    expect(repo.findAll).toHaveBeenCalledWith(10, 0);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ pagination: { total: 2, page: 1, limit: 10 } });
  });

  it('findAll honours supplied page/limit and computes offset', async () => {
    const repo = buildRepo();
    const svc = new BomService(repo);

    await svc.findAll({ page: 3, limit: 25 });

    expect(repo.findAll).toHaveBeenCalledWith(25, 50);
  });

  it('findOne returns header merged with items when both succeed', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 7, productId: 100 } }),
      findItemsByBomId: jest.fn().mockResolvedValue({ ok: true, data: [{ materialId: 1 }, { materialId: 2 }] }),
    });
    const svc = new BomService(repo);

    const result = await svc.findOne(7);

    expect(result).toMatchObject({ id: 7, items: [{ materialId: 1 }, { materialId: 2 }] });
    expect(repo.findItemsByBomId).toHaveBeenCalledWith(7);
  });

  it('findOne throws NotFoundException when the header is null', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    });
    const svc = new BomService(repo);

    await expect(svc.findOne(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create forwards the dto to the repository and surfaces created row', async () => {
    const repo = buildRepo({
      create: jest.fn().mockResolvedValue({ ok: true, data: { id: 42, productId: 9 } }),
    });
    const svc = new BomService(repo);

    const r = await svc.create({ productId: 9, name: 'BOM-X' });

    expect(repo.create).toHaveBeenCalledWith({ productId: 9, name: 'BOM-X' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((r.data as { id: number }).id).toBe(42);
  });

  it('remove returns a localized confirmation message after soft-delete', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 9 } }),
    });
    const svc = new BomService(repo);

    const r = await svc.remove(9);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({ message: "O'chirildi" });
    expect(repo.softDelete).toHaveBeenCalledWith(9);
  });
});
