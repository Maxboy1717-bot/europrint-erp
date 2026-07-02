/**
 * @file inventory-freeze.service.spec.ts
 * @description W3-COUNT inventarizatsiya muzlatish — unit testlar (mock repo).
 *
 * Qoplangan stsenariylar (Q-40 real enforcement):
 *   1. Muzlatish yo'q → chiqim ruxsat etiladi (fail-open, allowed=true).
 *   2. Butun-zona muzlatishi (material_id NULL) → chiqim BLOK (BLOCK_ZONE_FROZEN).
 *   3. Faqat bitta material muzlatilgan → shu material uchun BLOK, xabarda material ID.
 *   4. Repo xatosi (DB xato) → fail-open (chiqim TO'XTATILMAYDI, lekin loglanadi).
 *
 * Mock repo — DB ga tegmaydi; faqat `checkExitAllowed()` darvoza mantig'i tekshiriladi.
 */

jest.mock('../../src/shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
}));

import { InventoryFreezeService } from '../../src/modules/wms/application/inventory-freeze.service';
import type { IInventoryFreezeRepo } from '../../src/modules/wms/domain/repositories/i-inventory-freeze.repo';
import { Ok, Err } from '../../src/common/result';

function makeMockRepo(
  freeze: { id: number; material_id: number | null } | null,
): jest.Mocked<IInventoryFreezeRepo> {
  return {
    findActiveFreeze: jest.fn(async () => Ok(freeze)),
    createFreeze: jest.fn(),
    releaseFreeze: jest.fn(),
    listFreezes: jest.fn(),
    listDeviationReasons: jest.fn(),
    deviationReasonExists: jest.fn(),
  } as unknown as jest.Mocked<IInventoryFreezeRepo>;
}

describe('InventoryFreezeService.checkExitAllowed', () => {
  it('muzlatish yo\'q → allowed=true, blockCode=null (fail-open)', async () => {
    const repo = makeMockRepo(null);
    const svc = new InventoryFreezeService(repo);

    const res = await svc.checkExitAllowed(10, 5);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.allowed).toBe(true);
      expect(res.data.blockCode).toBeNull();
      expect(res.data.message).toBeNull();
    }
    expect(repo.findActiveFreeze).toHaveBeenCalledWith(10, 5);
  });

  it('butun-zona muzlatishi (material_id NULL) → BLOK, xabarda "butun zona"', async () => {
    const repo = makeMockRepo({ id: 99, material_id: null });
    const svc = new InventoryFreezeService(repo);

    const res = await svc.checkExitAllowed(10, 5);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.allowed).toBe(false);
      expect(res.data.blockCode).toBe('BLOCK_ZONE_FROZEN');
      expect(res.data.message).toContain('butun zona');
      expect(res.data.message).toContain('#10');
    }
  });

  it('faqat bitta material muzlatilgan → BLOK, xabarda material ID', async () => {
    const repo = makeMockRepo({ id: 7, material_id: 5 });
    const svc = new InventoryFreezeService(repo);

    const res = await svc.checkExitAllowed(10, 5);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.allowed).toBe(false);
      expect(res.data.blockCode).toBe('BLOCK_ZONE_FROZEN');
      expect(res.data.message).toContain('material #5');
    }
  });

  it('repo xatosi (DB xato) → fail-open, chiqim TO\'XTATILMAYDI', async () => {
    const repo: jest.Mocked<IInventoryFreezeRepo> = {
      findActiveFreeze: jest.fn(async () => Err({ code: 'DB_ERROR', message: 'boom' })),
      createFreeze: jest.fn(),
      releaseFreeze: jest.fn(),
      listFreezes: jest.fn(),
      listDeviationReasons: jest.fn(),
      deviationReasonExists: jest.fn(),
    } as unknown as jest.Mocked<IInventoryFreezeRepo>;
    const svc = new InventoryFreezeService(repo);

    const res = await svc.checkExitAllowed(10, 5);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.allowed).toBe(true);
      expect(res.data.blockCode).toBeNull();
    }
  });
});

describe('InventoryFreezeService — delegating methods (repo pass-through)', () => {
  it('freezeZone → repo.createFreeze bilan chaqiriladi va natija qaytariladi', async () => {
    const repo = makeMockRepo(null);
    (repo.createFreeze as jest.Mock).mockResolvedValue(Ok({ id: 1 }));
    const svc = new InventoryFreezeService(repo);

    const input = {
      warehouseId: 10,
      materialId: null,
      countId: 3,
      reason: 'yillik inventarizatsiya',
      frozenBy: 42,
    };
    const res = await svc.freezeZone(input);

    expect(repo.createFreeze).toHaveBeenCalledWith(input);
    expect(res.ok).toBe(true);
  });

  it('releaseZone → repo.releaseFreeze bilan chaqiriladi', async () => {
    const repo = makeMockRepo(null);
    (repo.releaseFreeze as jest.Mock).mockResolvedValue(Ok({ id: 1 }));
    const svc = new InventoryFreezeService(repo);

    await svc.releaseZone(1, 42);

    expect(repo.releaseFreeze).toHaveBeenCalledWith(1, 42);
  });

  it('validateDeviationReason → repo.deviationReasonExists bilan chaqiriladi', async () => {
    const repo = makeMockRepo(null);
    (repo.deviationReasonExists as jest.Mock).mockResolvedValue(Ok(true));
    const svc = new InventoryFreezeService(repo);

    const res = await svc.validateDeviationReason('DAMAGED');

    expect(repo.deviationReasonExists).toHaveBeenCalledWith('DAMAGED');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toBe(true);
  });
});
