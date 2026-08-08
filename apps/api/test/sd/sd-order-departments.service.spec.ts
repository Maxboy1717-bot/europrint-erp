/**
 * sd-order-departments.service.spec.ts
 *
 * Unit tests for SdOrderDepartmentsService. Repository is mocked; the service is a thin
 * orchestrator (Phase 4 fan-out source) that forwards calls but each forward path — and
 * Result propagation (Ok/Err) — is asserted, following the sibling sd/application spec
 * convention (see sd-payments.service.spec.ts).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SdOrderDepartmentsService } from '../../src/modules/sd/application/sd-order-departments.service';
import { SdOrderDepartmentsRepository } from '../../src/modules/sd/orders/drizzle-sd-order-departments.repo';
import { Ok, Err } from '../../src/common/result';

type RepoMock = {
  setForOrder: jest.Mock;
  listForOrder: jest.Mock;
  getSaga: jest.Mock;
  setMoldStatus: jest.Mock;
  setDesignStatus: jest.Mock;
  setClicheStatus: jest.Mock;
  setShippingStatus: jest.Mock;
  setMaterialStatus: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    setForOrder: jest.fn(),
    listForOrder: jest.fn(),
    getSaga: jest.fn(),
    setMoldStatus: jest.fn(),
    setDesignStatus: jest.fn(),
    setClicheStatus: jest.fn(),
    setShippingStatus: jest.fn(),
    setMaterialStatus: jest.fn(),
  };
}

describe('SdOrderDepartmentsService', () => {
  let svc: SdOrderDepartmentsService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SdOrderDepartmentsService,
        { provide: SdOrderDepartmentsRepository, useValue: repo },
      ],
    }).compile();
    svc = module.get(SdOrderDepartmentsService);
  });

  it('forwards setForOrder arguments verbatim to the repository', async () => {
    const depts = [{ department: 'mold', mode: 'internal' }, { department: 'cliche' }];
    repo.setForOrder.mockResolvedValue(Ok([{ id: 1, department: 'mold' }]));
    await svc.setForOrder(42, depts);
    expect(repo.setForOrder).toHaveBeenCalledWith(42, depts);
  });

  it('returns the repository payload unchanged when setForOrder succeeds', async () => {
    const payload = [{ id: 1, department: 'mold', status: 'pending' }];
    repo.setForOrder.mockResolvedValue(Ok(payload));
    const r = await svc.setForOrder(42, [{ department: 'mold' }]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(payload);
  });

  it('propagates Err when the repository fails to save departments', async () => {
    repo.setForOrder.mockResolvedValue(Err("Bo'lim tanlashni saqlashda xatolik"));
    const r = await svc.setForOrder(42, [{ department: 'mold' }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe("Bo'lim tanlashni saqlashda xatolik");
  });

  it('forwards listForOrder order id and returns the repository rows', async () => {
    const rows = [{ id: 1, department: 'mold' }, { id: 2, department: 'design' }];
    repo.listForOrder.mockResolvedValue(Ok(rows));
    const r = await svc.listForOrder(7);
    expect(repo.listForOrder).toHaveBeenCalledWith(7);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual(rows);
  });

  it('forwards getSaga order id and returns the repository saga view', async () => {
    const saga = { order: { id: 7 }, departments: [], tracks: [] };
    repo.getSaga.mockResolvedValue(Ok(saga));
    const r = await svc.getSaga(7);
    expect(repo.getSaga).toHaveBeenCalledWith(7);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(saga);
  });

  it('propagates Err when getSaga cannot find the order', async () => {
    repo.getSaga.mockResolvedValue(Err('Buyurtma #999 topilmadi'));
    const r = await svc.getSaga(999);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe('Buyurtma #999 topilmadi');
  });

  it('forwards setMoldStatus arguments verbatim', async () => {
    repo.setMoldStatus.mockResolvedValue(Ok({ id: 'mold-1', status: 'RECEIVED' }));
    await svc.setMoldStatus(7, 'mold-1', 'RECEIVED');
    expect(repo.setMoldStatus).toHaveBeenCalledWith(7, 'mold-1', 'RECEIVED');
  });

  it('forwards setDesignStatus arguments verbatim', async () => {
    repo.setDesignStatus.mockResolvedValue(Ok({ id: 'tc-1', status: 'CONFIRMED' }));
    await svc.setDesignStatus(7, 'tc-1', 'CONFIRMED');
    expect(repo.setDesignStatus).toHaveBeenCalledWith(7, 'tc-1', 'CONFIRMED');
  });

  it('forwards setClicheStatus arguments verbatim', async () => {
    repo.setClicheStatus.mockResolvedValue(Ok({ id: 'cl-1', status: 'ARRIVED' }));
    await svc.setClicheStatus(7, 'cl-1', 'ARRIVED');
    expect(repo.setClicheStatus).toHaveBeenCalledWith(7, 'cl-1', 'ARRIVED');
  });

  it('forwards setShippingStatus arguments verbatim (no dept-item id)', async () => {
    repo.setShippingStatus.mockResolvedValue(Ok({ id: 'd-1', status: 'DELIVERED' }));
    await svc.setShippingStatus(7, 'DELIVERED');
    expect(repo.setShippingStatus).toHaveBeenCalledWith(7, 'DELIVERED');
  });

  it('forwards setMaterialStatus arguments verbatim', async () => {
    repo.setMaterialStatus.mockResolvedValue(Ok({ id: 'mr-1', status: 'ISSUED' }));
    await svc.setMaterialStatus(7, 'mr-1', 'ISSUED');
    expect(repo.setMaterialStatus).toHaveBeenCalledWith(7, 'mr-1', 'ISSUED');
  });

  it('propagates Err when a status update targets a missing dept-item', async () => {
    repo.setMaterialStatus.mockResolvedValue(Err('Material requirement topilmadi'));
    const r = await svc.setMaterialStatus(7, 'missing', 'ISSUED');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe('Material requirement topilmadi');
  });
});
