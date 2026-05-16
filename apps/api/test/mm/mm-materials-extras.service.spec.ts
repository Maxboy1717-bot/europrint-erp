/**
 * test/mm/mm-materials-extras.service.spec.ts
 *
 * MmMaterialsExtrasService — paginates raw materials and material cards.
 * Key behaviour: listRawMaterials falls back to material_cards when raw
 * materials returns no rows. Pagination is page-based and converted to
 * limit / offset for the repository.
 */

import { MmMaterialsExtrasService } from '../../src/modules/mm/application/mm-materials-extras.service';
import { MmMaterialsExtrasRepository } from '../../src/modules/mm/application/mm-materials-extras.repository';

function buildRepo(overrides: Partial<jest.Mocked<MmMaterialsExtrasRepository>> = {}): jest.Mocked<MmMaterialsExtrasRepository> {
  return {
    listRawMaterials: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    listRawMaterialsFallback: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    listMaterialCards: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    getMaterialCard: jest.fn().mockResolvedValue({ ok: true, data: null }),
    ...overrides,
  } as unknown as jest.Mocked<MmMaterialsExtrasRepository>;
}

describe('MmMaterialsExtrasService', () => {
  it('listRawMaterials returns repo rows when they exist (no fallback)', async () => {
    const repo = buildRepo({
      listRawMaterials: jest.fn().mockResolvedValue({ ok: true, data: [{ id: 1, name: 'Paper' }] }),
    });
    const svc = new MmMaterialsExtrasService(repo);

    const r = await svc.listRawMaterials(1, 20);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual([{ id: 1, name: 'Paper' }]);
    expect(repo.listRawMaterials).toHaveBeenCalledWith(20, 0, undefined);
    expect(repo.listRawMaterialsFallback).not.toHaveBeenCalled();
  });

  it('listRawMaterials falls back to material_cards when raw_materials is empty', async () => {
    const repo = buildRepo({
      listRawMaterials: jest.fn().mockResolvedValue({ ok: true, data: [] }),
      listRawMaterialsFallback: jest.fn().mockResolvedValue({ ok: true, data: [{ id: 5, name: 'Ink' }] }),
    });
    const svc = new MmMaterialsExtrasService(repo);

    await svc.listRawMaterials(2, 10, 'ink');

    expect(repo.listRawMaterials).toHaveBeenCalledWith(10, 10, 'ink');
    expect(repo.listRawMaterialsFallback).toHaveBeenCalledWith(10, 10, 'ink');
  });

  it('listMaterialCards converts page to offset using limit', async () => {
    const repo = buildRepo();
    const svc = new MmMaterialsExtrasService(repo);

    await svc.listMaterialCards(4, 25, 'card', 'consumable');

    expect(repo.listMaterialCards).toHaveBeenCalledWith(25, 75, 'card', 'consumable');
  });

  it('getMaterialCard delegates to repository getMaterialCard', async () => {
    const repo = buildRepo({
      getMaterialCard: jest.fn().mockResolvedValue({ ok: true, data: { id: 9, name: 'Cardboard' } }),
    });
    const svc = new MmMaterialsExtrasService(repo);

    const r = await svc.getMaterialCard(9);

    expect(repo.getMaterialCard).toHaveBeenCalledWith(9);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ id: 9 });
  });

  it('listRawMaterials returns the fallback Result envelope when both queries empty', async () => {
    const repo = buildRepo({
      listRawMaterials: jest.fn().mockResolvedValue({ ok: true, data: [] }),
      listRawMaterialsFallback: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    });
    const svc = new MmMaterialsExtrasService(repo);

    const r = await svc.listRawMaterials(1, 10);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // safeCall preserves the fallback Result wrapper when used as return value
    const inner = r.data as { ok: boolean; data: unknown[] };
    expect(inner.data).toEqual([]);
  });
});
