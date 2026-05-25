/**
 * test/admin/create-user.handler.spec.ts
 * Unit tests for CreateUserService. The IUserRepo is mocked; UserAggregate is real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserService, CreateUserCommand } from '../../src/modules/admin/application/services/create-user.service';
import { USER_REPO } from '../../src/modules/admin/admin.tokens';
import { UserAggregate, UserRole } from '../../src/modules/admin/domain/aggregates/user.aggregate';
import { userFactory } from '../_fixtures/factories';

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
    findById:       jest.fn(),
    findByUsername: jest.fn().mockResolvedValue(null),
    findByEmail:    jest.fn().mockResolvedValue(null),
    findAll:        jest.fn(),
    create:         jest.fn(),
    update:         jest.fn(),
    softDelete:     jest.fn(),
    restore:        jest.fn(),
  };
}

function makeCmd(over: Partial<CreateUserCommand> = {}): CreateUserCommand {
  const f = userFactory();
  return {
    username: f.username,
    email:    f.email,
    password: 'TestPass1!',
    role:     UserRole.EMPLOYEE,
    ...over,
  };
}

function makeUser(): UserAggregate {
  return UserAggregate.create('alice', 'alice@x.uz', 'hash', UserRole.EMPLOYEE);
}

describe('CreateUserService', () => {
  let handler: CreateUserService;
  let repo: UserRepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserService,
        { provide: USER_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(CreateUserService);
  });

  it('returns CONFLICT when username already exists', async () => {
    repo.findByUsername.mockResolvedValue(makeUser());

    const r = await handler.execute(makeCmd({ username: 'dup' }));

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('CONFLICT');
      expect(r.error.message).toMatch(/username/i);
    }
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns CONFLICT when email already exists', async () => {
    repo.findByEmail.mockResolvedValue(makeUser());

    const r = await handler.execute(makeCmd({ email: 'dup@x.uz' }));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('CONFLICT');
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('returns Ok with persisted aggregate when input is unique', async () => {
    const persisted = makeUser();
    repo.create.mockResolvedValue(persisted);

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(persisted);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('persists aggregate with hashed password (not plaintext) when input is valid', async () => {
    repo.create.mockImplementation(async (u: UserAggregate) => u);

    await handler.execute(makeCmd({ password: 'Plain!42' }));

    const passed = repo.create.mock.calls[0][0] as UserAggregate;
    const hash = passed.toPersistence().passwordHash;
    expect(hash).not.toBe('Plain!42');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('assigns department + position when both are provided in command', async () => {
    repo.create.mockImplementation(async (u: UserAggregate) => u);

    await handler.execute(makeCmd({ departmentId: 7, positionId: 11 }));

    const passed = repo.create.mock.calls[0][0] as UserAggregate;
    expect(passed.getDepartmentId()).toBe(7);
    expect(passed.getPositionId()).toBe(11);
  });
});
