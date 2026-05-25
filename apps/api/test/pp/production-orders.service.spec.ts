/**
 * test/pp/production-orders.service.spec.ts
 *
 * ProductionOrdersService is a thin layer over IPpProductionOrdersRepository
 * that adds pagination defaults, NotFoundException for missing IDs, and
 * delegates updateStatus / soft delete.
 */

import { NotFoundException } from '@nestjs/common';
import { ProductionOrdersService } from '../../src/modules/pp/production-orders/production-orders.service';
import type { IPpProductionOrdersRepository } from '../../src/modules/pp/production-orders/i-pp-production-orders.repo';

function buildRepo(overrides: Partial<jest.Mocked<IPpProductionOrdersRepository>> = {}): jest.Mocked<IPpProductionOrdersRepository> {
  return {
    findAll: jest.fn().mockResolvedValue({ ok: true, data: { data: [], count: 0 } }),
    findById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    findByOrderNumber: jest.fn().mockResolvedValue({ ok: true, data: null }),
    create: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    update: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    updateStatus: jest.fn().mockResolvedValue({ ok: true, data: { id: 1, status: 'released' } }),
    softDelete: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    ...overrides,
  };
}

describe('ProductionOrdersService', () => {
  it('findAll wraps repository data inside a pagination envelope', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue({
        ok: true,
        data: { data: [{ id: 1, status: 'draft' }, { id: 2, status: 'released' }], count: 2 },
      }),
    });
    const svc = new ProductionOrdersService(repo);

    const r = await svc.findAll({});

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ pagination: { total: 2, page: 1, limit: 10 } });
  });

  it('findOne returns the production order when found', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 99, status: 'released' } }),
    });
    const svc = new ProductionOrdersService(repo);

    const result = await svc.findOne(99);

    expect(result).toEqual({ id: 99, status: 'released' });
  });

  it('findOne throws NotFoundException for a missing order id', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    });
    const svc = new ProductionOrdersService(repo);

    await expect(svc.findOne(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create forwards both dto and optional createdBy id to the repository', async () => {
    const repo = buildRepo({
      create: jest.fn().mockResolvedValue({ ok: true, data: { id: 10 } }),
    });
    const svc = new ProductionOrdersService(repo);

    await svc.create({ productId: 5, qty: 100 }, 7);

    expect(repo.create).toHaveBeenCalledWith({ productId: 5, qty: 100 }, 7);
  });

  it('updateStatus checks existence before calling repo.updateStatus', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 5, status: 'draft' } }),
    });
    const svc = new ProductionOrdersService(repo);

    const r = await svc.updateStatus(5, 'released');

    expect(repo.findById).toHaveBeenCalledWith(5);
    expect(repo.updateStatus).toHaveBeenCalledWith(5, 'released');
    expect(r.ok).toBe(true);
  });

  it('remove confirms with localized message after soft-delete', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 7 } }),
    });
    const svc = new ProductionOrdersService(repo);

    const r = await svc.remove(7);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({ message: "O'chirildi" });
  });
});
