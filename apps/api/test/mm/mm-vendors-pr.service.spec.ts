/**
 * test/mm/mm-vendors-pr.service.spec.ts
 *
 * MmVendorsPrService — vendor and purchase-requisition orchestration.
 * Notable behaviours:
 *   - listVendors wraps search term in SQL ILIKE pattern (%...%)
 *   - getRequisition combines header + items, NotFoundException on missing
 *   - createRequisition iterates items after the header is created
 */

import { MmVendorsPrService } from '../../src/modules/mm/application/mm-vendors-pr.service';
import { MmVendorsPrRepository } from '../../src/modules/mm/application/mm-vendors-pr.repository';

function buildRepo(overrides: Partial<jest.Mocked<MmVendorsPrRepository>> = {}): jest.Mocked<MmVendorsPrRepository> {
  return {
    listVendors: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    getVendor: jest.fn().mockResolvedValue({ ok: true, data: null }),
    createVendor: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    updateVendor: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    deleteVendor: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    listRequisitions: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    getRequisitionHeader: jest.fn().mockResolvedValue(null),
    getRequisitionItems: jest.fn().mockResolvedValue([]),
    createRequisition: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    createRequisitionItem: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    updateRequisition: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    deleteRequisition: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    ...overrides,
  } as unknown as jest.Mocked<MmVendorsPrRepository>;
}

describe('MmVendorsPrService', () => {
  it('listVendors wraps the search term in % wildcards', async () => {
    const repo = buildRepo();
    const svc = new MmVendorsPrService(repo);

    await svc.listVendors('acme', 20, 0);

    expect(repo.listVendors).toHaveBeenCalledWith('%acme%', 20, 0);
  });

  it('listVendors passes null pattern when no search term supplied', async () => {
    const repo = buildRepo();
    const svc = new MmVendorsPrService(repo);

    await svc.listVendors(undefined, 50, 10);

    expect(repo.listVendors).toHaveBeenCalledWith(null, 50, 10);
  });

  it('getRequisition combines header and items', async () => {
    const repo = buildRepo({
      getRequisitionHeader: jest.fn().mockResolvedValue({ id: 5, title: 'PR-5' }),
      getRequisitionItems: jest.fn().mockResolvedValue([{ id: 1, qty: 10 }]),
    });
    const svc = new MmVendorsPrService(repo);

    const r = await svc.getRequisition(5);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ id: 5, items: [{ id: 1, qty: 10 }] });
  });

  it('getRequisition surfaces NotFoundException when header missing', async () => {
    const repo = buildRepo({
      getRequisitionHeader: jest.fn().mockResolvedValue(null),
    });
    const svc = new MmVendorsPrService(repo);

    const r = await svc.getRequisition(404);

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NOT_FOUND');
  });

  it('createRequisition inserts header then each item with header id', async () => {
    const repo = buildRepo({
      createRequisition: jest.fn().mockResolvedValue({ ok: true, data: { id: 77, title: 'PR-77' } }),
    });
    const svc = new MmVendorsPrService(repo);

    await svc.createRequisition('PR-77', 1, '2026-06-01', null, [
      { material_id: 1, quantity: 5, unit_price: 100 },
      { material_id: 2, quantity: 3, unit_price: 200 },
    ]);

    expect(repo.createRequisition).toHaveBeenCalledWith('PR-77', 1, '2026-06-01', null);
    expect(repo.createRequisitionItem).toHaveBeenCalledTimes(2);
    expect(repo.createRequisitionItem).toHaveBeenNthCalledWith(1, 77, 1, 5, 100);
    expect(repo.createRequisitionItem).toHaveBeenNthCalledWith(2, 77, 2, 3, 200);
  });

  it('deleteVendor forwards id to the repository directly', async () => {
    const repo = buildRepo();
    const svc = new MmVendorsPrService(repo);

    await svc.deleteVendor(33);

    expect(repo.deleteVendor).toHaveBeenCalledWith(33);
  });
});
