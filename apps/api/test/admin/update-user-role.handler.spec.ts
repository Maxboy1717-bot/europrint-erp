/**
 * test/admin/update-user-role.handler.spec.ts
 * Unit tests for UpdateUserRoleService. The IUserRepo is mocked; UserAggregate is real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserRoleService, UpdateUserRoleCommand } from '../../src/modules/admin/application/services/update-user-role.service';
import { USER_REPO } from '../../src/modules/admin/admin.tokens';
import { UserAggregate, UserRole } from '../../src/modules/admin/domain/aggregates/user.aggregate';

interface UserRepoMock {
  findById:       jest.Mock;
  findByUsername: jest.Mock;
  findByEmail:    jest.Mock;
  findAll:        jest.Mock;
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

function makeUser(role: UserRole = UserRole.EMPLOYEE): UserAggregate {
  return UserAggregate.create('alice', 'a@x.uz', 'hash', role);
}

function makeCmd(over: Partial<UpdateUserRoleCommand> = {}): UpdateUserRoleCommand {
  return { userId: 42, newRole: UserRole.DIRECTOR, executorId: 1, ...over };
}

describe('UpdateUserRoleService', () => {
  let handler: UpdateUserRoleService;
  let repo: UserRepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserRoleService,
        { provide: USER_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(UpdateUserRoleService);
  });

  it('returns NOT_FOUND when user does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('NOT_FOUND');
      expect(r.error.message).toMatch(/user/i);
    }
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('changes aggregate role to newRole when user exists', async () => {
    const user = makeUser(UserRole.EMPLOYEE);
    repo.findById.mockResolvedValue(user);
    repo.update.mockResolvedValue(user);

    const r = await handler.execute(makeCmd({ newRole: UserRole.DIRECTOR }));

    expect(r.ok).toBe(true);
    expect(user.getRole()).toBe(UserRole.DIRECTOR);
  });

  it('persists aggregate via repo.update when role change succeeds', async () => {
    const user = makeUser();
    repo.findById.mockResolvedValue(user);
    repo.update.mockResolvedValue(user);

    await handler.execute(makeCmd({ userId: 9, newRole: UserRole.ACCOUNTANT }));

    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(repo.update).toHaveBeenCalledWith(user);
  });

  it('returns Ok with void data when update completes', async () => {
    const user = makeUser();
    repo.findById.mockResolvedValue(user);
    repo.update.mockResolvedValue(user);

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBeUndefined();
  });
});
