/**
 * sd-payments.service.spec.ts
 *
 * Unit tests for SdPaymentsService. Repository is mocked; the service is a thin
 * orchestrator that forwards calls but each forward path is asserted.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SdPaymentsService } from '../../src/modules/sd/application/sd-payments.service';
import { SdPaymentsRepository } from '../../src/modules/sd/application/sd-payments.repository';
import { Ok, Err, AppErr } from '../../src/common/result';

type RepoMock = {
  list: jest.Mock;
  getDebitors: jest.Mock;
  getOverdue: jest.Mock;
  create: jest.Mock;
  getActiveRentals: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    list: jest.fn(),
    getDebitors: jest.fn(),
    getOverdue: jest.fn(),
    create: jest.fn(),
    getActiveRentals: jest.fn(),
  };
}

describe('SdPaymentsService', () => {
  let svc: SdPaymentsService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SdPaymentsService,
        { provide: SdPaymentsRepository, useValue: repo },
      ],
    }).compile();
    svc = module.get(SdPaymentsService);
  });

  it('forwards list arguments verbatim to repository', async () => {
    repo.list.mockResolvedValue(Ok({ data: [], total: 0 }));
    await svc.list(7, 'paid', 25, 50);
    expect(repo.list).toHaveBeenCalledWith(7, 'paid', 25, 50);
  });

  it('returns repository payload when list succeeds', async () => {
    const payload = { data: [{ id: 1 }], total: 1 };
    repo.list.mockResolvedValue(Ok(payload));
    const r = await svc.list(null, null, 10, 0);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(payload);
  });

  it('propagates Err when repository list fails', async () => {
    repo.list.mockResolvedValue(Err(AppErr('DB_ERROR', 'connection lost')));
    const r = await svc.list(null, null, 10, 0);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('returns debitor list when getDebitors succeeds', async () => {
    repo.getDebitors.mockResolvedValue(Ok([{ id: 9, balance: 1000 }]));
    const r = await svc.getDebitors(20, 0);
    expect(repo.getDebitors).toHaveBeenCalledWith(20, 0);
    expect(r.ok).toBe(true);
  });

  it('returns overdue list when getOverdue succeeds', async () => {
    repo.getOverdue.mockResolvedValue(Ok([{ id: 12, daysLate: 45 }]));
    const r = await svc.getOverdue(5, 10);
    expect(repo.getOverdue).toHaveBeenCalledWith(5, 10);
    expect(r.ok).toBe(true);
  });

  it('passes body unchanged when create is invoked', async () => {
    const body = { amount: 500, currency: 'UZS' };
    repo.create.mockResolvedValue(Ok({ id: 1, ...body }));
    await svc.create(body);
    expect(repo.create).toHaveBeenCalledWith(body);
  });

  it('returns Err when active rentals query fails', async () => {
    repo.getActiveRentals.mockResolvedValue(Err(AppErr('INTERNAL', 'oops')));
    const r = await svc.getActiveRentals(10, 0);
    expect(r.ok).toBe(false);
  });
});
