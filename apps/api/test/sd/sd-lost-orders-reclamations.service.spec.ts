/**
 * sd-lost-orders-reclamations.service.spec.ts
 *
 * Unit tests for SdLostOrdersReclamationsService. Repository is mocked; the
 * service is a thin orchestrator that forwards calls but each forward path
 * (arguments in, Result out) is asserted.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SdLostOrdersReclamationsService } from '../../src/modules/sd/application/sd-lost-orders-reclamations.service';
import { SD_LOST_ORDERS_RECLAMATIONS_REPO } from '../../src/modules/sd/domain/repositories/i-sd-lost-orders-reclamations.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

type RepoMock = {
  listLostOrders: jest.Mock;
  createLostOrder: jest.Mock;
  listReclamations: jest.Mock;
  getReclamation: jest.Mock;
  createReclamation: jest.Mock;
  resolveReclamation: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    listLostOrders: jest.fn(),
    createLostOrder: jest.fn(),
    listReclamations: jest.fn(),
    getReclamation: jest.fn(),
    createReclamation: jest.fn(),
    resolveReclamation: jest.fn(),
  };
}

describe('SdLostOrdersReclamationsService', () => {
  let svc: SdLostOrdersReclamationsService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SdLostOrdersReclamationsService,
        { provide: SD_LOST_ORDERS_RECLAMATIONS_REPO, useValue: repo },
      ],
    }).compile();
    svc = module.get(SdLostOrdersReclamationsService);
  });

  it('forwards listLostOrders filters verbatim to repository', async () => {
    const filters = { reasonCode: 'PRICE', customerId: 7 };
    repo.listLostOrders.mockResolvedValue(Ok([]));
    await svc.listLostOrders(filters);
    expect(repo.listLostOrders).toHaveBeenCalledWith(filters);
  });

  it('returns repository payload when listLostOrders succeeds', async () => {
    const rows = [{ id: 1, reasonCode: 'PRICE' }];
    repo.listLostOrders.mockResolvedValue(Ok(rows));
    const r = await svc.listLostOrders({});
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(rows);
  });

  it('propagates Err when repository listLostOrders fails', async () => {
    repo.listLostOrders.mockResolvedValue(Err(AppErr('DB_ERROR', 'connection lost')));
    const r = await svc.listLostOrders({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('passes input unchanged when createLostOrder is invoked', async () => {
    const input = { customerId: 3, reasonCode: 'STOCK', orderId: 55 } as never;
    repo.createLostOrder.mockResolvedValue(Ok({ id: 10, ...input }));
    await svc.createLostOrder(input);
    expect(repo.createLostOrder).toHaveBeenCalledWith(input);
  });

  it('forwards listReclamations filters verbatim to repository', async () => {
    const filters = { status: 'open', customerId: 4 };
    repo.listReclamations.mockResolvedValue(Ok([]));
    await svc.listReclamations(filters);
    expect(repo.listReclamations).toHaveBeenCalledWith(filters);
  });

  it('returns Err when getReclamation is not found in repository', async () => {
    repo.getReclamation.mockResolvedValue(Err(AppErr('NOT_FOUND', 'Reclamation not found')));
    const r = await svc.getReclamation(999);
    expect(repo.getReclamation).toHaveBeenCalledWith(999);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns reclamation row when getReclamation succeeds', async () => {
    const row = { id: 5, status: 'open' };
    repo.getReclamation.mockResolvedValue(Ok(row));
    const r = await svc.getReclamation(5);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(row);
  });

  it('passes input unchanged when createReclamation is invoked', async () => {
    const input = { customerId: 8, orderId: 20, description: 'defect' } as never;
    repo.createReclamation.mockResolvedValue(Ok({ id: 30, ...input }));
    await svc.createReclamation(input);
    expect(repo.createReclamation).toHaveBeenCalledWith(input);
  });

  it('forwards id and input to resolveReclamation on repository', async () => {
    const input = { resolution: 'refund', notes: 'ok' } as never;
    repo.resolveReclamation.mockResolvedValue(Ok({ id: 12, status: 'resolved' }));
    const r = await svc.resolveReclamation(12, input);
    expect(repo.resolveReclamation).toHaveBeenCalledWith(12, input);
    expect(r.ok).toBe(true);
  });

  it('propagates Err when resolveReclamation fails in repository', async () => {
    repo.resolveReclamation.mockResolvedValue(Err(AppErr('INTERNAL', 'oops')));
    const r = await svc.resolveReclamation(1, {} as never);
    expect(r.ok).toBe(false);
  });
});
