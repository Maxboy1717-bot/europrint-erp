/**
 * test/auth/get-my-permissions.handler.spec.ts
 *
 * Unit tests for GetMyPermissionsService. DrizzleMyPermissionsRepository and
 * RbacCacheService are mocked. Admin shortcut, no-position shortcut, and
 * the DB-fallback path are all exercised.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  GetMyPermissionsService,
} from '../../src/modules/auth/application/services/get-my-permissions.service';
import {
  DrizzleMyPermissionsRepository,
  type UserPositionRow,
} from '../../src/modules/auth/infrastructure/repositories/drizzle-my-permissions.repo';
import { RbacCacheService } from '../../src/common/cache/rbac-cache.service';
import { Ok, Err } from '../../src/common/result';

interface RepoMock {
  findUserWithPosition: jest.Mock;
  findModulePermissions: jest.Mock;
  findFeatureFlags: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    findUserWithPosition: jest.fn(),
    findModulePermissions: jest.fn().mockResolvedValue(Ok([])),
    findFeatureFlags: jest.fn().mockResolvedValue(Ok([])),
  };
}

function makeCache(connected = false): Partial<RbacCacheService> {
  return {
    isRedisConnected: connected,
    getPositionPerms: jest.fn().mockResolvedValue(Ok(null)),
    setPositionPerms: jest.fn().mockResolvedValue(Ok(undefined)),
  } as Partial<RbacCacheService>;
}

function makeUser(over: Partial<UserPositionRow> = {}): UserPositionRow {
  return {
    userId: 1, username: 'alice', role: 'employee',
    positionId: 42, orgFunctionId: null, positionCode: 'OP', positionNameUz: 'Operator', positionNameRu: 'Оператор',
    departmentCode: 'PROD', departmentNameUz: 'Ishlab chiqarish',
    rbacTier: 'specialist', ...over,
  };
}

describe('GetMyPermissionsService', () => {
  let handler: GetMyPermissionsService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyPermissionsService,
        { provide: DrizzleMyPermissionsRepository, useValue: repo },
        { provide: RbacCacheService, useValue: makeCache(false) },
      ],
    }).compile();
    handler = module.get(GetMyPermissionsService);
  });

  it('returns INTERNAL when repo lookup fails', async () => {
    repo.findUserWithPosition.mockResolvedValue(Err('db gone'));

    const r = await handler.execute({ userId: 1 });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INTERNAL');
  });

  it('returns NOT_FOUND when no user row is found', async () => {
    repo.findUserWithPosition.mockResolvedValue(Ok(null));

    const r = await handler.execute({ userId: 99 });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('grants FULL on every module shortcut when role is super_admin', async () => {
    repo.findUserWithPosition.mockResolvedValue(Ok(makeUser({ role: 'super_admin' })));

    const r = await handler.execute({ userId: 1 });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.isAdmin).toBe(true);
      expect(r.data.modules.length).toBeGreaterThan(10);
      expect(r.data.modules.every((m) => m.level === 'FULL')).toBe(true);
    }
    expect(repo.findModulePermissions).not.toHaveBeenCalled();
  });

  it('returns empty permissions when user has no card (orgFunctionId) and no positionId', async () => {
    repo.findUserWithPosition.mockResolvedValue(
      Ok(makeUser({ role: 'employee', positionId: null, orgFunctionId: null })),
    );

    const r = await handler.execute({ userId: 1 });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.modules).toEqual([]);
      expect(r.data.featureFlags).toEqual([]);
      expect(r.data.isAdmin).toBe(false);
    }
  });

  it('loads modules + featureFlags from DB when not admin and cache is offline', async () => {
    repo.findUserWithPosition.mockResolvedValue(Ok(makeUser()));
    repo.findModulePermissions.mockResolvedValue(Ok([
      { module: 'CRM', level: 'READ' }, { module: 'SD', level: 'FULL' },
    ]));
    repo.findFeatureFlags.mockResolvedValue(Ok(['discount.override']));

    const r = await handler.execute({ userId: 1 });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.modules).toHaveLength(2);
      expect(r.data.featureFlags).toEqual(['discount.override']);
      expect(r.data.isAdmin).toBe(false);
    }
    // Karta-birinchi imzo: (positionId, orgFunctionId). Bu user kartasiz (orgFunctionId=null)
    // → position fallback yo'li.
    expect(repo.findModulePermissions).toHaveBeenCalledWith(42, null);
    expect(repo.findFeatureFlags).toHaveBeenCalledWith(42, null);
  });

  it('derives module permissions CARD-FIRST via orgFunctionId when present', async () => {
    repo.findUserWithPosition.mockResolvedValue(Ok(makeUser({ positionId: 12, orgFunctionId: 17 })));
    repo.findModulePermissions.mockResolvedValue(Ok([{ module: 'PP', level: 'FULL' }]));
    repo.findFeatureFlags.mockResolvedValue(Ok([]));

    const r = await handler.execute({ userId: 1 });

    expect(r.ok).toBe(true);
    // Card-first: both keys passed; repo prefers org_function_id, falls back to position_id.
    expect(repo.findModulePermissions).toHaveBeenCalledWith(12, 17);
    expect(repo.findFeatureFlags).toHaveBeenCalledWith(12, 17);
  });

  it('returns INTERNAL when module permissions query fails', async () => {
    repo.findUserWithPosition.mockResolvedValue(Ok(makeUser()));
    repo.findModulePermissions.mockResolvedValue(Err('db gone'));

    const r = await handler.execute({ userId: 1 });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INTERNAL');
  });
});
