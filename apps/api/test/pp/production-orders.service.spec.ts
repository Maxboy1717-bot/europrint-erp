/**
 * test/pp/production-orders.service.spec.ts
 *
 * ProductionOrdersService is a thin layer over IPpProductionOrdersRepository
 * that adds pagination defaults, NotFoundException for missing IDs, and
 * delegates updateStatus / soft delete.
 */

import { NotFoundException } from '@nestjs/common';
import type { I18nService } from 'nestjs-i18n';
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

function buildI18n(): I18nService {
  return { t: jest.fn().mockResolvedValue('Ishlab chiqarish buyurtmasi topilmadi') } as unknown as I18nService;
}

describe('ProductionOrdersService', () => {
  it('findAll wraps repository data inside a pagination envelope', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue({
        ok: true,
        data: { data: [{ id: 1, status: 'draft' }, { id: 2, status: 'released' }], count: 2 },
      }),
    });
    const svc = new ProductionOrdersService(repo, buildI18n());

    const r = await svc.findAll({});

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ pagination: { total: 2, page: 1, limit: 10 } });
  });

  it('findOne returns the production order when found', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 99, status: 'released' } }),
    });
    const svc = new ProductionOrdersService(repo, buildI18n());

    const result = await svc.findOne(99);

    expect(result).toEqual({ id: 99, status: 'released' });
  });

  it('findOne throws NotFoundException for a missing order id', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    });
    const svc = new ProductionOrdersService(repo, buildI18n());

    await expect(svc.findOne(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create forwards both dto and optional createdBy id to the repository', async () => {
    const repo = buildRepo({
      create: jest.fn().mockResolvedValue({ ok: true, data: { id: 10 } }),
    });
    const svc = new ProductionOrdersService(repo, buildI18n());

    await svc.create({ productId: 5, qty: 100 }, 7);

    expect(repo.create).toHaveBeenCalledWith({ productId: 5, qty: 100 }, 7);
  });

  it('updateStatus checks existence then forwards the acting user + reason to the repo (EP-PP-082)', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 5, status: 'planned' } }),
    });
    const svc = new ProductionOrdersService(repo, buildI18n());

    // planned -> confirmed is a legal PO_STATUS_TRANSITIONS hop.
    const r = await svc.updateStatus(5, 'confirmed', 7, 'Rejaga muvofiq tasdiqlandi');

    expect(repo.findById).toHaveBeenCalledWith(5);
    // The mandatory written justification (#2/#39) + acting user are threaded through
    // to repo.updateStatus so production_order_status_log records kim/nima-uchun.
    expect(repo.updateStatus).toHaveBeenCalledWith(5, 'confirmed', 7, 'Rejaga muvofiq tasdiqlandi');
    expect(r.ok).toBe(true);
  });

  it('updateStatus rejects an illegal lifecycle hop with a 400 (planned -> completed)', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 5, status: 'planned' } }),
    });
    const svc = new ProductionOrdersService(repo, buildI18n());

    // planned may only go to confirmed/released_to_production/cancelled — completed is illegal.
    const r = await svc.updateStatus(5, 'completed', 7, 'noqonuniy sakrash');

    // Illegal transition -> BadRequest surfaced as a failed Result; the row is never written.
    expect(r.ok).toBe(false);
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('remove confirms with localized message after soft-delete', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 7 } }),
    });
    const svc = new ProductionOrdersService(repo, buildI18n());

    const r = await svc.remove(7);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({ message: "O'chirildi" });
  });
});
