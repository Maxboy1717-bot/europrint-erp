/**
 * sd-customers.service.spec.ts
 *
 * Unit tests for SdCustomersService. Repository is mocked; SQL LIKE pattern
 * wrapping (`%search%`) executes as real business logic.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SdCustomersService } from '../../src/modules/sd/application/sd-customers.service';
import { DrizzleSdCustomersRepository } from '../../src/modules/sd/infrastructure/repositories/drizzle-sd-customers.repo';

type RepoMock = {
  list: jest.Mock;
  getById: jest.Mock;
  get360View: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  softDelete: jest.Mock;
  getContacts: jest.Mock;
  getRecentOrders: jest.Mock;
  addContact: jest.Mock;
  addCompetitor: jest.Mock;
  resolveComplaint: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    list: jest.fn(),
    getById: jest.fn(),
    get360View: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    getContacts: jest.fn(),
    getRecentOrders: jest.fn(),
    addContact: jest.fn(),
    addCompetitor: jest.fn(),
    resolveComplaint: jest.fn(),
  };
}

describe('SdCustomersService', () => {
  let svc: SdCustomersService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SdCustomersService,
        { provide: DrizzleSdCustomersRepository, useValue: repo },
      ],
    }).compile();
    svc = module.get(SdCustomersService);
  });

  it('wraps search term in SQL LIKE wildcards when list called with text', async () => {
    repo.list.mockResolvedValue([{ id: 1 }]);
    await svc.list('Acme', 'active', 10, 0);
    expect(repo.list).toHaveBeenCalledWith('%Acme%', 'active', 10, 0);
  });

  it('passes null pattern when search is undefined', async () => {
    repo.list.mockResolvedValue([]);
    await svc.list(undefined, undefined, 5, 0);
    expect(repo.list).toHaveBeenCalledWith(null, undefined, 5, 0);
  });

  it('returns Ok with payload when getById succeeds', async () => {
    repo.getById.mockResolvedValue({ id: 42, name: 'Acme' });
    const r = await svc.getById(42);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual({ id: 42, name: 'Acme' });
  });

  it('returns Err when getById throws', async () => {
    repo.getById.mockRejectedValue(new Error('db down'));
    const r = await svc.getById(42);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe('db down');
  });

  it('returns Err when get360View throws', async () => {
    repo.get360View.mockRejectedValue(new Error('view unavailable'));
    const r = await svc.get360View(99);
    expect(r.ok).toBe(false);
  });

  it('maps competitor body fields when adding competitor', async () => {
    repo.addCompetitor.mockResolvedValue({ id: 1 });
    await svc.addCompetitor(7, {
      competitor_name: 'Rival Co',
      notes: 'cheap',
      product_type: 'paper',
      estimated_share_pct: 25,
      win_back_potential: 'high',
    });
    expect(repo.addCompetitor).toHaveBeenCalledWith(7, 'Rival Co', 'cheap', 'paper', 25, 'high');
  });

  it('falls back to camelCase aliases when adding competitor', async () => {
    repo.addCompetitor.mockResolvedValue({ id: 2 });
    await svc.addCompetitor(7, {
      name: 'Alt Co',
      notes: 'fast',
      product: 'ink',
      estimatedSharePct: 15,
      winBackPotential: 'medium',
    });
    expect(repo.addCompetitor).toHaveBeenCalledWith(7, 'Alt Co', 'fast', 'ink', 15, 'medium');
  });

  it('returns Ok payload when softDelete repo succeeds', async () => {
    repo.softDelete.mockResolvedValue({ deleted: true });
    const r = await svc.softDelete(42);
    expect(r.ok).toBe(true);
  });

  // B14 (2026-07-05): create()/update() never threaded the current user into
  // sd_customers.created_by/updated_by; both columns existed but stayed NULL forever.
  it('passes createdBy through to repo.create', async () => {
    repo.create.mockResolvedValue({ id: 1 });
    await svc.create({ name: 'Acme' }, 42);
    expect(repo.create).toHaveBeenCalledWith({ name: 'Acme' }, 42);
  });

  it('passes updatedBy through to repo.update', async () => {
    repo.update.mockResolvedValue([{ id: 1 }]);
    await svc.update(1, { name: 'Acme Updated' }, 7);
    expect(repo.update).toHaveBeenCalledWith(1, { name: 'Acme Updated' }, 7);
  });
});
