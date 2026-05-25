/**
 * test/admin/list-users.handler.spec.ts
 * Unit tests for ListUsersService. The IUserRepo is mocked; UserAggregate is real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ListUsersService, ListUsersQuery } from '../../src/modules/admin/application/services/list-users.service';
import { USER_REPO } from '../../src/modules/admin/admin.tokens';
import { UserAggregate, UserRole } from '../../src/modules/admin/domain/aggregates/user.aggregate';
import type { PaginatedResult } from '../../src/modules/admin/domain/repositories/i-user.repo';

interface UserRepoMock {
  findById:       jest.Mock;
  findByUsername: jest.Mock;
  findByEmail:    jest.Mock;
  findAll:        jest.Mock<Promise<PaginatedResult<UserAggregate>>, [unknown]>;
  create:         jest.Mock;
  update:         jest.Mock;
  softDelete:     jest.Mock;
  restore:        jest.Mock;
}

function makeRepo(): UserRepoMock {
  return {
    findById: jest.fn(),
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  };
}

function makePage(items: UserAggregate[], total: number, page: number, limit: number): PaginatedResult<UserAggregate> {
  return { data: items, total, page, limit, pages: Math.ceil(total / limit) };
}

describe('ListUsersService', () => {
  let handler: ListUsersService;
  let repo: UserRepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ListUsersService,
        { provide: USER_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(ListUsersService);
  });

  it('defaults page=1 and limit=20 when filters omit them', async () => {
    repo.findAll.mockResolvedValue(makePage([], 0, 1, 20));

    const q: ListUsersQuery = { filters: {} };
    await handler.execute(q);

    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it('caps limit to 100 when caller requests more than 100', async () => {
    repo.findAll.mockResolvedValue(makePage([], 0, 1, 100));

    await handler.execute({ filters: { page: 2, limit: 500 } });

    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });

  it('passes status/role filters through to repo unchanged', async () => {
    repo.findAll.mockResolvedValue(makePage([], 0, 1, 20));

    await handler.execute({ filters: { role: 'director', departmentId: 5, isActive: true } });

    const call = repo.findAll.mock.calls[0][0] as Record<string, unknown>;
    expect(call.role).toBe('director');
    expect(call.departmentId).toBe(5);
    expect(call.isActive).toBe(true);
  });

  it('returns Ok with PaginatedResult from repo when query succeeds', async () => {
    const user = UserAggregate.create('alice', 'a@x.uz', 'hash', UserRole.EMPLOYEE);
    const paged = makePage([user], 1, 1, 20);
    repo.findAll.mockResolvedValue(paged);

    const r = await handler.execute({ filters: {} });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.total).toBe(1);
      expect(r.data.data).toHaveLength(1);
      expect(r.data.data[0]).toBe(user);
    }
  });
});
