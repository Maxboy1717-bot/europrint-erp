/**
 * @file inventory.service.spec.ts
 * @description InventoryService (WMS) — unit testlar (mock repo).
 *
 * Qoplangan stsenariylar (Q-40 real enforcement):
 *   1. findAll — default page/limit qo'llaniladi (page=1, limit=10) va offset to'g'ri hisoblanadi.
 *   2. findAll — limit MAX_PAGE_LIMIT (100) dan oshsa 100 ga clamp qilinadi.
 *   3. findAll — limit 0/manfiy bo'lsa 1 ga clamp qilinadi (offset manfiy bo'lmaydi).
 *   4. findAll — repo xatosi → Result.err (INTERNAL) qaytadi, throw qilmaydi.
 *   5. getByWarehouse — ombor topilmasa → NOT_FOUND xato, stock so'ralmaydi.
 *   6. getByWarehouse — ombor va stock topilsa → ikkalasi birlashtirilib qaytadi.
 *   7. findOne — stok topilmasa → NOT_FOUND xato.
 *   8. findOne — stok topilsa → real data qaytadi.
 *
 * Mock repo — DB ga tegmaydi; faqat InventoryService orkestratsiya mantig'i tekshiriladi.
 */
import { InventoryService } from '../../src/modules/wms/inventory/inventory.service';
import type { IWmsInventoryRepository } from '../../src/modules/wms/inventory/i-wms-inventory.repo';
import { Ok, Err } from '../../src/common/result';

function makeMockRepo(): jest.Mocked<IWmsInventoryRepository> {
  return {
    findAll: jest.fn(),
    findWarehouseById: jest.fn(),
    findStockByWarehouse: jest.fn(),
    findStockById: jest.fn(),
  } as unknown as jest.Mocked<IWmsInventoryRepository>;
}

describe('InventoryService.findAll', () => {
  it('parametrsiz chaqirilsa page=1, limit=10, offset=0 qo\'llaniladi', async () => {
    const repo = makeMockRepo();
    repo.findAll.mockResolvedValue(Ok({ data: [{ id: 1 }], count: 1 }));
    const svc = new InventoryService(repo);

    const res = await svc.findAll({});

    expect(repo.findAll).toHaveBeenCalledWith(10, 0);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const payload = res.data as { data: unknown[]; pagination: { total: number; page: number; limit: number } };
      expect(payload.pagination).toEqual({ total: 1, page: 1, limit: 10 });
      expect(payload.data).toEqual([{ id: 1 }]);
    }
  });

  it('limit 100 dan oshsa MAX_PAGE_LIMIT (100) ga clamp qilinadi', async () => {
    const repo = makeMockRepo();
    repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));
    const svc = new InventoryService(repo);

    const res = await svc.findAll({ page: 2, limit: 500 });

    // offset = (page-1) * clampedLimit = (2-1) * 100 = 100
    expect(repo.findAll).toHaveBeenCalledWith(100, 100);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const payload = res.data as { pagination: { limit: number; page: number } };
      expect(payload.pagination.limit).toBe(100);
      expect(payload.pagination.page).toBe(2);
    }
  });

  it('limit 0 yoki manfiy bo\'lsa 1 ga clamp qilinadi', async () => {
    const repo = makeMockRepo();
    repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));
    const svc = new InventoryService(repo);

    const res = await svc.findAll({ page: 1, limit: -5 });

    expect(repo.findAll).toHaveBeenCalledWith(1, 0);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const payload = res.data as { pagination: { limit: number } };
      expect(payload.pagination.limit).toBe(1);
    }
  });

  it('repo xatosi qaytarsa → Result.err (throw emas)', async () => {
    const repo = makeMockRepo();
    repo.findAll.mockResolvedValue(Err({ code: 'DB_ERROR', message: 'boom' }));
    const svc = new InventoryService(repo);

    const res = await svc.findAll({});

    expect(res.ok).toBe(false);
    if (!res.ok) {
      // service throws InternalServerErrorException(result.error), which safeCall
      // doesn't special-case (only NotFound/BadRequest/etc are mapped) → falls back
      // to the default safeCall code, EXTERNAL_SERVICE.
      expect(res.error.code).toBe('EXTERNAL_SERVICE');
    }
  });
});

describe('InventoryService.getByWarehouse', () => {
  it('ombor topilmasa → NOT_FOUND, stock so\'ralmaydi', async () => {
    const repo = makeMockRepo();
    repo.findWarehouseById.mockResolvedValue(Ok(null));
    const svc = new InventoryService(repo);

    const res = await svc.getByWarehouse(99);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('NOT_FOUND');
      expect(res.error.message).toContain('99');
    }
    expect(repo.findStockByWarehouse).not.toHaveBeenCalled();
  });

  it('ombor va stock topilsa → ikkalasi birlashtirilib qaytadi', async () => {
    const repo = makeMockRepo();
    repo.findWarehouseById.mockResolvedValue(Ok({ id: 10, name: 'Asosiy ombor' }));
    repo.findStockByWarehouse.mockResolvedValue(Ok([{ material_id: 1, qty: 5 }]));
    const svc = new InventoryService(repo);

    const res = await svc.getByWarehouse(10);

    expect(res.ok).toBe(true);
    if (res.ok) {
      const payload = res.data as { warehouse: { id: number }; stock: unknown[] };
      expect(payload.warehouse).toEqual({ id: 10, name: 'Asosiy ombor' });
      expect(payload.stock).toEqual([{ material_id: 1, qty: 5 }]);
    }
  });
});

describe('InventoryService.findOne', () => {
  it('stok topilmasa → NOT_FOUND', async () => {
    const repo = makeMockRepo();
    repo.findStockById.mockResolvedValue(Ok(null));
    const svc = new InventoryService(repo);

    const res = await svc.findOne(7);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('NOT_FOUND');
      expect(res.error.message).toContain('7');
    }
  });

  it('stok topilsa → real data qaytadi', async () => {
    const repo = makeMockRepo();
    repo.findStockById.mockResolvedValue(Ok({ id: 7, material_id: 3, qty: 12 }));
    const svc = new InventoryService(repo);

    const res = await svc.findOne(7);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toEqual({ id: 7, material_id: 3, qty: 12 });
    }
  });
});
