/**
 * test/mro/mro-inventory.service.spec.ts
 *
 * Unit tests for MroInventoryService. The service is constructed directly
 * with a mocked MroInventoryRepository (no DI container, no DB) — mirrors
 * the pattern used in test/qc/qc-parameters.service.spec.ts.
 *
 * Coverage targets:
 *   findAll()
 *     - defaults page/limit to 1/10 when query is empty
 *     - passes through explicit page/limit (as numbers, even when given as strings)
 *     - falls back to data=[] / total=0 when repo.findAll returns ok:false
 *     - echoes the requested page/limit in the pagination envelope (not repo values)
 *
 *   findOne()
 *     - NOTE (documents current, if surprising, behaviour): the method checks
 *       `if (!row) throw NotFoundException` against the *Result wrapper*
 *       returned by repo.findOne (never the unwrapped row). Since a Result is
 *       always a truthy object, the guard never fires — findOne always
 *       resolves with the raw Result wrapper it got from the repo, even when
 *       the repo reports "not found" (data: null) or an internal Err. These
 *       tests lock in that real behaviour so a silent change is caught.
 *
 *   create()
 *     - fills name='' and quantity/minQuantity='0' when omitted from the dto
 *     - passes partNumber/warehouseId/unit/unitPrice through untouched
 *     - delegates to repo.create() and returns Ok(repo's row) via safeCall
 *
 *   update()
 *     - always proceeds to repo.update() regardless of whether findOne
 *       "found" anything (consequence of the findOne guard above)
 *     - propagates repo.update() Err through safeCall
 *
 *   remove()
 *     - delegates to repo.remove() and returns the success message
 *     - propagates repo.remove() throwing/Err through safeCall as Err
 */

import { MroInventoryService } from '../../src/modules/mro/inventory/mro-inventory.service';
import { MroInventoryRepository } from '../../src/modules/mro/inventory/mro-inventory.repository';

function buildRepo(overrides: Partial<jest.Mocked<MroInventoryRepository>> = {}): jest.Mocked<MroInventoryRepository> {
  return {
    findAll: jest.fn().mockResolvedValue({ ok: true, data: { data: [], total: 0 } }),
    findOne: jest.fn().mockResolvedValue({ ok: true, data: null }),
    create: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    update: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    remove: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    ...overrides,
  } as unknown as jest.Mocked<MroInventoryRepository>;
}

describe('MroInventoryService.findAll', () => {
  it('defaults page=1, limit=10 when query is empty', async () => {
    const repo = buildRepo();
    const svc = new MroInventoryService(repo);

    const r = await svc.findAll();

    expect(repo.findAll).toHaveBeenCalledWith(1, 10);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 10 } });
  });

  it('casts string page/limit query params to numbers before calling the repo', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue({ ok: true, data: { data: [{ id: 9 }], total: 1 } }),
    });
    const svc = new MroInventoryService(repo);

    await svc.findAll({ page: '3', limit: '25' });

    expect(repo.findAll).toHaveBeenCalledWith(3, 25);
  });

  it('falls back to empty data/total=0 when repo.findAll reports ok:false', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue({ ok: false, error: { code: 'DB_ERROR', message: 'boom' } }),
    });
    const svc = new MroInventoryService(repo);

    const r = await svc.findAll({ page: 2, limit: 5 });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const data = r.data as { data: unknown[]; pagination: { total: number; page: number; limit: number } };
    expect(data.data).toEqual([]);
    expect(data.pagination.total).toBe(0);
  });

  it('echoes the requested page/limit in the pagination envelope, not repo-derived values', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue({ ok: true, data: { data: [{ id: 1 }, { id: 2 }], total: 2 } }),
    });
    const svc = new MroInventoryService(repo);

    const r = await svc.findAll({ page: 4, limit: 50 });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const data = r.data as { pagination: { total: number; page: number; limit: number } };
    expect(data.pagination).toEqual({ total: 2, page: 4, limit: 50 });
  });
});

describe('MroInventoryService.findOne', () => {
  it('resolves with the raw Result wrapper (data:null case) instead of throwing NotFoundException', async () => {
    // repo reports "not found" as Ok({ data: null }) — the service's `!row`
    // guard checks the wrapper object itself, which is always truthy, so
    // the NotFoundException branch is unreachable in practice.
    const repo = buildRepo({ findOne: jest.fn().mockResolvedValue({ ok: true, data: null }) });
    const svc = new MroInventoryService(repo);

    const row = await svc.findOne(999);

    expect(row).toEqual({ ok: true, data: null });
  });

  it('resolves with the raw Result wrapper when the repo finds a row', async () => {
    const repo = buildRepo({ findOne: jest.fn().mockResolvedValue({ ok: true, data: { id: 5, name: 'Belt' } }) });
    const svc = new MroInventoryService(repo);

    const row = await svc.findOne(5);

    expect(row).toEqual({ ok: true, data: { id: 5, name: 'Belt' } });
  });
});

describe('MroInventoryService.create', () => {
  it('defaults name to "" and quantity/minQuantity to "0" when omitted', async () => {
    const repo = buildRepo();
    const svc = new MroInventoryService(repo);

    await svc.create({ partNumber: 'BELT-1', warehouseId: 'WH-1' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: '', quantity: '0', minQuantity: '0', partNumber: 'BELT-1', warehouseId: 'WH-1' }),
    );
  });

  it('passes through explicit name/quantity/unit/unitPrice untouched', async () => {
    const repo = buildRepo();
    const svc = new MroInventoryService(repo);

    await svc.create({ name: 'Conveyor Belt', quantity: '12', unit: 'pcs', unitPrice: '99.50', minQuantity: '3' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Conveyor Belt', quantity: '12', unit: 'pcs', unitPrice: '99.50', minQuantity: '3' }),
    );
  });

  it('returns Ok(repo row) on success', async () => {
    const repo = buildRepo({ create: jest.fn().mockResolvedValue({ ok: true, data: { id: 42, name: 'Belt' } }) });
    const svc = new MroInventoryService(repo);

    const r = await svc.create({ name: 'Belt' });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({ ok: true, data: { id: 42, name: 'Belt' } });
  });

  it('propagates a thrown repo error as Err via safeCall', async () => {
    const repo = buildRepo({ create: jest.fn().mockRejectedValue(new Error('insert failed')) });
    const svc = new MroInventoryService(repo);

    const r = await svc.create({ name: 'Belt' });

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.message).toBe('insert failed');
  });
});

describe('MroInventoryService.update', () => {
  it('proceeds to repo.update() even for a non-existent id (findOne never throws)', async () => {
    const repo = buildRepo({ findOne: jest.fn().mockResolvedValue({ ok: true, data: null }) });
    const svc = new MroInventoryService(repo);

    const r = await svc.update(999, { name: 'Renamed' });

    expect(repo.update).toHaveBeenCalledWith(999, { name: 'Renamed' });
    expect(r.ok).toBe(true);
  });

  it('propagates repo.update() Err through safeCall when it rejects', async () => {
    const repo = buildRepo({ update: jest.fn().mockRejectedValue(new Error('conflict')) });
    const svc = new MroInventoryService(repo);

    const r = await svc.update(1, { name: 'X' });

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.message).toBe('conflict');
  });
});

describe('MroInventoryService.remove', () => {
  it('delegates to repo.remove() and returns the success message', async () => {
    const repo = buildRepo();
    const svc = new MroInventoryService(repo);

    const r = await svc.remove(7);

    expect(repo.remove).toHaveBeenCalledWith(7);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({ message: "O'chirildi" });
  });

  it('propagates a thrown repo error as Err via safeCall', async () => {
    const repo = buildRepo({ remove: jest.fn().mockRejectedValue(new Error('FK violation')) });
    const svc = new MroInventoryService(repo);

    const r = await svc.remove(1);

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.message).toBe('FK violation');
  });
});
