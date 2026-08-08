/**
 * test/unit/guards/permission.guard.spec.ts
 *
 * Unit tests for PermissionGuard. Verifies admin bypass, the no-decorator
 * pass-through, missing-user denial, permission-match success and
 * permission-missing denial. Mocks the Drizzle `db` and the RbacCacheService.
 */

jest.mock('@shared/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([]),
  },
}));

import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from '../../../src/common/guards/permission.guard';
import { RbacCacheService } from '../../../src/common/cache/rbac-cache.service';
import { db } from '@shared/db';

interface DbMock {
  select: jest.Mock;
  from: jest.Mock;
  where: jest.Mock;
}

interface CtxUser {
  role?: string;
  positionId?: number;
}

function makeReflector(required: string | undefined): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as unknown as Reflector;
}

function makeContext(user: CtxUser | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function makeCache(connected: boolean): RbacCacheService {
  return {
    isRedisConnected: connected,
    getPositionPerms: jest.fn(),
    setPositionPerms: jest.fn(),
  } as unknown as RbacCacheService;
}

function makeI18n(): { t: jest.Mock } {
  return { t: jest.fn().mockResolvedValue('translated') };
}

describe('PermissionGuard', () => {
  beforeEach(() => {
    const mocked = db as unknown as DbMock;
    mocked.select.mockClear();
    mocked.from.mockClear();
    mocked.where.mockReset();
    mocked.select.mockReturnValue(mocked);
    mocked.from.mockReturnValue(mocked);
  });

  it('returns true when no @RequirePermission decorator is set', async () => {
    const guard = new PermissionGuard(makeReflector(undefined), makeCache(false), makeI18n() as never);
    const ctx = makeContext({ role: 'employee' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns false when user is missing from request', async () => {
    const guard = new PermissionGuard(makeReflector('hr:READ'), makeCache(false), makeI18n() as never);
    const ctx = makeContext(undefined);
    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });

  it('returns true when user is admin role and bypasses lookup', async () => {
    const guard = new PermissionGuard(makeReflector('finance:WRITE'), makeCache(false), makeI18n() as never);
    const ctx = makeContext({ role: 'admin' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns true when DB grants matching permission for position', async () => {
    const mocked = db as unknown as DbMock;
    mocked.where.mockResolvedValueOnce([
      { positionId: 5, moduleCode: 'hr', accessLevel: 'WRITE' },
    ]);
    const guard = new PermissionGuard(makeReflector('hr:READ'), makeCache(false), makeI18n() as never);
    const ctx = makeContext({ role: 'employee', positionId: 5 });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns false when DB has no permission matching the module', async () => {
    const mocked = db as unknown as DbMock;
    mocked.where.mockResolvedValueOnce([
      { positionId: 5, moduleCode: 'finance', accessLevel: 'READ' },
    ]);
    const guard = new PermissionGuard(makeReflector('hr:READ'), makeCache(false), makeI18n() as never);
    const ctx = makeContext({ role: 'employee', positionId: 5 });
    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });

  it('returns false when position has insufficient access level', async () => {
    const mocked = db as unknown as DbMock;
    mocked.where.mockResolvedValueOnce([
      { positionId: 5, moduleCode: 'hr', accessLevel: 'READ' },
    ]);
    const guard = new PermissionGuard(makeReflector('hr:FULL'), makeCache(false), makeI18n() as never);
    const ctx = makeContext({ role: 'employee', positionId: 5 });
    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });

  it('returns false when user has no positionId attached', async () => {
    const guard = new PermissionGuard(makeReflector('hr:READ'), makeCache(false), makeI18n() as never);
    const ctx = makeContext({ role: 'employee' });
    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });
});
