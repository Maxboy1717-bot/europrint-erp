/**
 * test/mm/purchase.service.spec.ts
 *
 * PurchaseService manages purchase-order lifecycle.
 *   - toApiStatus / toDbStatus mappings between persistence enum and API enum
 *   - PO_STATUS_MACHINE only allows declared transitions
 *   - getOrderById hydrates items, throws NotFoundException when missing
 */

import { PurchaseService } from '../../src/modules/mm/purchase/purchase.service';
import type { IPurchaseSvcRepository } from '../../src/modules/mm/purchase/i-purchase-svc.repo';

function buildRepo(overrides: Partial<jest.Mocked<IPurchaseSvcRepository>> = {}): jest.Mocked<IPurchaseSvcRepository> {
  return {
    findAll: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    findById: jest.fn().mockResolvedValue({ ok: true, data: null }),
    findItemsByOrderId: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    create: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    updateStatus: jest.fn().mockResolvedValue({ ok: true, data: { id: 1, status: 'sent' } }),
    ...overrides,
  };
}

const fakeI18n = { t: jest.fn().mockResolvedValue('Topilmadi') } as never;

describe('PurchaseService', () => {
  it('translates DB statuses to API statuses', () => {
    const repo = buildRepo();
    const svc = new PurchaseService(repo, fakeI18n);

    expect(svc.toApiStatus('sent')).toBe('pending');
    expect(svc.toApiStatus('confirmed')).toBe('approved');
    expect(svc.toApiStatus('partially_received')).toBe('partial');
    expect(svc.toApiStatus('fully_received')).toBe('completed');
    expect(svc.toApiStatus('unknown')).toBe('unknown');
  });

  it('translates API statuses to DB statuses', () => {
    const repo = buildRepo();
    const svc = new PurchaseService(repo, fakeI18n);

    expect(svc.toDbStatus('pending')).toBe('sent');
    expect(svc.toDbStatus('approved')).toBe('confirmed');
    expect(svc.toDbStatus('completed')).toBe('fully_received');
  });

  it('getOrders converts DB statuses to API statuses for every row', async () => {
    const repo = buildRepo({
      findAll: jest.fn().mockResolvedValue({
        ok: true,
        data: [
          { id: 1, status: 'sent', totalAmount: '100' },
          { id: 2, status: 'confirmed', totalAmount: '200' },
        ],
      }),
    });
    const svc = new PurchaseService(repo, fakeI18n);

    const r = await svc.getOrders();

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const items = (r.data as { data: Array<{ status: string; totalAmount: number }> }).data;
    expect(items[0].status).toBe('pending');
    expect(items[1].status).toBe('approved');
    expect(items[0].totalAmount).toBe(100);
  });

  it('getOrderById merges items with the header', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 9, status: 'sent' } }),
      findItemsByOrderId: jest.fn().mockResolvedValue({ ok: true, data: [{ id: 1, material_id: 7 }] }),
    });
    const svc = new PurchaseService(repo, fakeI18n);

    const r = await svc.getOrderById(9);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ id: 9, status: 'pending', items: [{ id: 1 }] });
  });

  it('updateStatus rejects transitions not in the status machine', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 1, status: 'fully_received' } }),
    });
    const svc = new PurchaseService(repo, fakeI18n);

    const r = await svc.updateStatus(1, 'draft');

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('BAD_REQUEST');
  });

  it('updateStatus allows draft → sent and writes mapped DB value', async () => {
    const repo = buildRepo({
      findById: jest.fn().mockResolvedValue({ ok: true, data: { id: 1, status: 'draft' } }),
      updateStatus: jest.fn().mockResolvedValue({ ok: true, data: { id: 1, status: 'sent' } }),
    });
    const svc = new PurchaseService(repo, fakeI18n);

    const r = await svc.updateStatus(1, 'pending');

    expect(repo.updateStatus).toHaveBeenCalledWith(1, 'sent');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((r.data as { status: string }).status).toBe('pending');
  });
});
