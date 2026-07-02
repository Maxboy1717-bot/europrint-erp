/**
 * @file inventory-materials.service.spec.ts
 * @description Unit tests for InventoryMaterialsService (mock repo — DB ga tegmaydi).
 *
 * Qoplangan stsenariylar (Q-40 real enforcement):
 *   1. listMaterials — pagination offset hisobi ((page-1)*limit) va default qiymatlar.
 *   2. listMaterials — repo Result'larini unwrap qilish (ok/not-ok, array-emas fallback).
 *   3. getMaterial360Card — 4 ta parallel repo chaqiruvni bitta obyektga birlashtirish.
 *   4. createMaterial/updateMaterial/getLowStockList — repo pass-through.
 *   5. deleteMaterial — muvaffaqiyat/repo-xato holatlarida id ni to'g'ri chiqarish.
 */

import { InventoryMaterialsService } from '../../src/modules/wms/application/inventory-materials.service';
import type { IInventoryMaterialsRepo } from '../../src/modules/wms/domain/repositories/i-inventory-materials.repo';
import { Ok, Err } from '../../src/common/result';

function makeMockRepo(): jest.Mocked<IInventoryMaterialsRepo> {
  return {
    listMaterials: jest.fn(),
    countMaterials: jest.fn(),
    createMaterial: jest.fn(),
    getMaterial: jest.fn(),
    getMaterialStock: jest.fn(),
    getMaterialRecentPurchases: jest.fn(),
    getMaterialRecentTransactions: jest.fn(),
    updateMaterial: jest.fn(),
    deleteMaterial: jest.fn(),
    getLowStockList: jest.fn(),
  } as unknown as jest.Mocked<IInventoryMaterialsRepo>;
}

describe('InventoryMaterialsService.listMaterials', () => {
  it('default page/limit → offset=0, limit=50 passed to repo', async () => {
    const repo = makeMockRepo();
    repo.listMaterials.mockResolvedValue(Ok([]));
    repo.countMaterials.mockResolvedValue(Ok(0));
    const svc = new InventoryMaterialsService(repo);

    const res = await svc.listMaterials();

    expect(res.ok).toBe(true);
    expect(repo.listMaterials).toHaveBeenCalledWith(undefined, undefined, 50, 0);
  });

  it('page=3, limit=20 → offset=(3-1)*20=40', async () => {
    const repo = makeMockRepo();
    repo.listMaterials.mockResolvedValue(Ok([]));
    repo.countMaterials.mockResolvedValue(Ok(0));
    const svc = new InventoryMaterialsService(repo);

    await svc.listMaterials('kraft', 'raw', 3, 20);

    expect(repo.listMaterials).toHaveBeenCalledWith('kraft', 'raw', 20, 40);
    expect(repo.countMaterials).toHaveBeenCalledWith('kraft');
  });

  it('repo Results ok → items/total unwrapped correctly', async () => {
    const repo = makeMockRepo();
    const rows = [{ id: 1 }, { id: 2 }];
    repo.listMaterials.mockResolvedValue(Ok(rows));
    repo.countMaterials.mockResolvedValue(Ok(2));
    const svc = new InventoryMaterialsService(repo);

    const res = await svc.listMaterials();

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toEqual({ items: rows, total: 2, page: 1, limit: 50 });
    }
  });

  it('repo.listMaterials not ok → items falls back to empty array (never leaks Result wrapper)', async () => {
    const repo = makeMockRepo();
    repo.listMaterials.mockResolvedValue(Err({ code: 'DB_ERROR', message: 'boom' }));
    repo.countMaterials.mockResolvedValue(Ok(5));
    const svc = new InventoryMaterialsService(repo);

    const res = await svc.listMaterials();

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toEqual({ items: [], total: 5, page: 1, limit: 50 });
    }
  });

  it('repo.listMaterials ok but data is not an array → items falls back to empty array (Qoida 2)', async () => {
    const repo = makeMockRepo();
    // Defensive: even a well-behaved repo contract could hand back a non-array;
    // the service must never propagate a raw non-array to the controller/FE.
    repo.listMaterials.mockResolvedValue(Ok(null as unknown as Record<string, unknown>[]));
    repo.countMaterials.mockResolvedValue(Ok(0));
    const svc = new InventoryMaterialsService(repo);

    const res = await svc.listMaterials();

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toMatchObject({ items: [] });
    }
  });

  it('repo.countMaterials not ok → total falls back to 0', async () => {
    const repo = makeMockRepo();
    repo.listMaterials.mockResolvedValue(Ok([]));
    repo.countMaterials.mockResolvedValue(Err({ code: 'DB_ERROR', message: 'boom' }));
    const svc = new InventoryMaterialsService(repo);

    const res = await svc.listMaterials();

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toMatchObject({ total: 0 });
    }
  });
});

describe('InventoryMaterialsService.getMaterial360Card', () => {
  it('combines material/stock/recent_purchases/recent_transactions from repo calls', async () => {
    const repo = makeMockRepo();
    const material = Ok({ id: 7, name: 'Kraft 140g' });
    const stock = Ok([{ warehouse_id: 1, quantity: 100 }]);
    const purchases = Ok([{ id: 55 }]);
    const transactions = Ok([{ id: 99 }]);
    repo.getMaterial.mockResolvedValue(material);
    repo.getMaterialStock.mockResolvedValue(stock);
    repo.getMaterialRecentPurchases.mockResolvedValue(purchases);
    repo.getMaterialRecentTransactions.mockResolvedValue(transactions);
    const svc = new InventoryMaterialsService(repo);

    const res = await svc.getMaterial360Card(7);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toEqual({
        material,
        stock,
        recent_purchases: purchases,
        recent_transactions: transactions,
      });
    }
    expect(repo.getMaterial).toHaveBeenCalledWith(7);
    expect(repo.getMaterialStock).toHaveBeenCalledWith(7);
    expect(repo.getMaterialRecentPurchases).toHaveBeenCalledWith(7);
    expect(repo.getMaterialRecentTransactions).toHaveBeenCalledWith(7);
  });

  it('a single repo rejection is caught by safeCall and surfaces as Err (never throws)', async () => {
    const repo = makeMockRepo();
    repo.getMaterial.mockRejectedValue(new Error('connection lost'));
    repo.getMaterialStock.mockResolvedValue(Ok([]));
    repo.getMaterialRecentPurchases.mockResolvedValue(Ok([]));
    repo.getMaterialRecentTransactions.mockResolvedValue(Ok([]));
    const svc = new InventoryMaterialsService(repo);

    const res = await svc.getMaterial360Card(1);

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe('connection lost');
  });
});

describe('InventoryMaterialsService — delegating methods (repo pass-through)', () => {
  it('createMaterial → repo.createMaterial called with body, result returned verbatim', async () => {
    const repo = makeMockRepo();
    const created = Ok({ id: 10, name: 'Yangi material' });
    repo.createMaterial.mockResolvedValue(created);
    const svc = new InventoryMaterialsService(repo);

    const body = { name: 'Yangi material' };
    const res = await svc.createMaterial(body);

    expect(repo.createMaterial).toHaveBeenCalledWith(body);
    expect(res).toBe(created);
  });

  it('updateMaterial → repo.updateMaterial called with id+body, result returned verbatim', async () => {
    const repo = makeMockRepo();
    const updated = Ok({ id: 10, name: 'Yangilangan' });
    repo.updateMaterial.mockResolvedValue(updated);
    const svc = new InventoryMaterialsService(repo);

    const body = { name: 'Yangilangan' };
    const res = await svc.updateMaterial(10, body);

    expect(repo.updateMaterial).toHaveBeenCalledWith(10, body);
    expect(res).toBe(updated);
  });

  it('getLowStockList → repo.getLowStockList result returned verbatim', async () => {
    const repo = makeMockRepo();
    const list = Ok([{ id: 1, quantity: 2 }]);
    repo.getLowStockList.mockResolvedValue(list);
    const svc = new InventoryMaterialsService(repo);

    const res = await svc.getLowStockList();

    expect(repo.getLowStockList).toHaveBeenCalled();
    expect(res).toBe(list);
  });
});

describe('InventoryMaterialsService.deleteMaterial', () => {
  it('repo delete ok with row.id → success=true, id echoed back', async () => {
    const repo = makeMockRepo();
    repo.deleteMaterial.mockResolvedValue(Ok({ id: 42 }));
    const svc = new InventoryMaterialsService(repo);

    const res = await svc.deleteMaterial(42);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toEqual({ success: true, id: 42 });
    }
    expect(repo.deleteMaterial).toHaveBeenCalledWith(42);
  });

  it('repo delete not ok → success=true (safeCall never throws) but id=null', async () => {
    const repo = makeMockRepo();
    repo.deleteMaterial.mockResolvedValue(Err({ code: 'NOT_FOUND', message: 'material topilmadi' }));
    const svc = new InventoryMaterialsService(repo);

    const res = await svc.deleteMaterial(999);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toEqual({ success: true, id: null });
    }
  });

  it('repo.deleteMaterial rejects → safeCall converts throw into Err (never propagates raw throw)', async () => {
    const repo = makeMockRepo();
    repo.deleteMaterial.mockRejectedValue(new Error('fk constraint violation'));
    const svc = new InventoryMaterialsService(repo);

    const res = await svc.deleteMaterial(1);

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe('fk constraint violation');
  });
});
