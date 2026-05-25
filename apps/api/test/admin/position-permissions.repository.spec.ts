/**
 * Unit tests for PositionPermissionsRepository.
 * Covers happy path (Ok) and DB error path (Err) for every public method.
 * No real DB — the @europrint/schemas barrel is mocked via a chainable Proxy.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@europrint/schemas', () => ({
  db: dbStub,
  positions: { id: 'positions.id', deleted_at: 'positions.deleted_at' },
  positionPermissions: {
    id: 'pp.id',
    positionId: 'pp.position_id',
    moduleCode: 'pp.module_code',
    accessLevel: 'pp.access_level',
  },
}));

import { PositionPermissionsRepository } from '../../src/modules/admin/position-permissions/position-permissions.repository';

describe('PositionPermissionsRepository', () => {
  let repo: PositionPermissionsRepository;
  beforeEach(() => {
    repo = new PositionPermissionsRepository();
    dbStub.__setResolved([]);
  });

  describe('findPosition', () => {
    it('returns Ok with row when position exists', async () => {
      dbStub.__setResolved([{ id: 1, name: 'Manager' }]);
      const r = await repo.findPosition(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, name: 'Manager' });
    });

    it('returns Ok with null when row missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findPosition(999);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('connection lost'));
      const r = await repo.findPosition(1);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('connection lost');
    });
  });

  describe('findPermissionsByPosition', () => {
    it('returns Ok with rows when records exist', async () => {
      dbStub.__setResolved([{ id: 10, positionId: 1, accessLevel: 'read' }]);
      const r = await repo.findPermissionsByPosition(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when no permissions', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findPermissionsByPosition(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('query timeout'));
      const r = await repo.findPermissionsByPosition(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findAllPositions', () => {
    it('returns Ok with active positions when query succeeds', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }]);
      const r = await repo.findAllPositions();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when none exist', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findAllPositions();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('permission denied'));
      const r = await repo.findAllPositions();
      expect(r.ok).toBe(false);
    });
  });

  describe('findAllPermissions', () => {
    it('returns Ok with all permissions when records present', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const r = await repo.findAllPermissions();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(3);
    });

    it('returns Ok with empty array when none exist', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findAllPermissions();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('disk full'));
      const r = await repo.findAllPermissions();
      expect(r.ok).toBe(false);
    });
  });

  describe('findExistingPermissions', () => {
    it('returns Ok with rows when permissions exist for position', async () => {
      dbStub.__setResolved([{ id: 5 }]);
      const r = await repo.findExistingPermissions(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when position has none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findExistingPermissions(42);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findExistingPermissions(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('updatePermission', () => {
    it('returns Ok with updated row when record exists', async () => {
      dbStub.__setResolved([{ id: 7, accessLevel: 'write' }]);
      const r = await repo.updatePermission(7, 'write');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data[0]?.accessLevel).toBe('write');
    });

    it('returns Ok with empty array when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.updatePermission(999, 'admin');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('lock conflict'));
      const r = await repo.updatePermission(1, 'read');
      expect(r.ok).toBe(false);
    });
  });

  describe('insertPermission', () => {
    it('returns Ok with inserted row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 11, positionId: 1, moduleCode: 'HR', accessLevel: 'read' }]);
      const r = await repo.insertPermission(1, 'HR', 'read');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data[0]?.id).toBe(11);
    });

    it('returns Ok with empty array when no row returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.insertPermission(2, 'FIN', 'write');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws unique constraint error', async () => {
      dbStub.__setRejected(new Error('duplicate key'));
      const r = await repo.insertPermission(1, 'HR', 'read');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('duplicate key');
    });
  });
});
