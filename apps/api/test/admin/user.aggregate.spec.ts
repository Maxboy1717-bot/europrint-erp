/**
 * test/admin/user.aggregate.spec.ts
 * Unit tests for UserAggregate — admin domain user with role,
 * department/position assignment, activation, and password reset.
 */
import { UserAggregate, UserRole, UserAggregateData } from '../../src/modules/admin/domain/aggregates/user.aggregate';
import { userFactory } from '../_fixtures/factories';

function buildData(overrides: Partial<UserAggregateData> = {}): UserAggregateData {
  const f = userFactory();
  return {
    id: f.id,
    username: f.username,
    email: f.email,
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
    role: UserRole.EMPLOYEE,
    departmentId: null,
    positionId: null,
    isActive: f.isActive,
    lastLogin: null,
    createdAt: f.createdAt,
    updatedAt: f.createdAt,
    ...overrides,
  };
}

describe('UserAggregate', () => {
  describe('static create()', () => {
    it('produces an active employee when no role given', () => {
      const u = UserAggregate.create('alice', 'a@e.uz', '$2b$10$xxxx');
      expect(u.getUsername()).toBe('alice');
      expect(u.getEmail()).toBe('a@e.uz');
      expect(u.getRole()).toBe(UserRole.EMPLOYEE);
      expect(u.isUserActive()).toBe(true);
    });

    it('assigns SUPER_ADMIN role when provided', () => {
      const u = UserAggregate.create('root', 'r@e.uz', '$2b$10$xxxx', UserRole.SUPER_ADMIN);
      expect(u.getRole()).toBe(UserRole.SUPER_ADMIN);
    });

    it('produces id=0 placeholder before persistence', () => {
      const u = UserAggregate.create('bob', 'b@e.uz', '$2b$10$y');
      expect(u.getId()).toBe(0);
    });

    it('produces null department and position on create', () => {
      const u = UserAggregate.create('c', 'c@e.uz', '$2b$10$y');
      expect(u.getDepartmentId()).toBeNull();
      expect(u.getPositionId()).toBeNull();
    });
  });

  describe('constructor()', () => {
    it('hydrates all fields from persistence data', () => {
      const u = new UserAggregate(buildData({ id: 7, role: UserRole.DIRECTOR }));
      expect(u.getId()).toBe(7);
      expect(u.getRole()).toBe(UserRole.DIRECTOR);
    });
  });

  describe('activate() / deactivate()', () => {
    it('flips isActive to true when previously inactive', () => {
      const u = new UserAggregate(buildData({ isActive: false }));
      u.activate();
      expect(u.isUserActive()).toBe(true);
    });

    it('flips isActive to false when previously active', () => {
      const u = new UserAggregate(buildData({ isActive: true }));
      u.deactivate();
      expect(u.isUserActive()).toBe(false);
    });

    it('keeps isActive=true when activate() called twice', () => {
      const u = new UserAggregate(buildData({ isActive: false }));
      u.activate();
      u.activate();
      expect(u.isUserActive()).toBe(true);
    });

    it('keeps isActive=false when deactivate() called twice', () => {
      const u = new UserAggregate(buildData({ isActive: true }));
      u.deactivate();
      u.deactivate();
      expect(u.isUserActive()).toBe(false);
    });
  });

  describe('changeRole()', () => {
    it('updates role from EMPLOYEE to DEPARTMENT_HEAD', () => {
      const u = new UserAggregate(buildData({ role: UserRole.EMPLOYEE }));
      u.changeRole(UserRole.DEPARTMENT_HEAD);
      expect(u.getRole()).toBe(UserRole.DEPARTMENT_HEAD);
    });

    it('updates role from DIRECTOR to ACCOUNTANT', () => {
      const u = new UserAggregate(buildData({ role: UserRole.DIRECTOR }));
      u.changeRole(UserRole.ACCOUNTANT);
      expect(u.getRole()).toBe(UserRole.ACCOUNTANT);
    });
  });

  describe('assignDepartment() / assignPosition()', () => {
    it('sets departmentId on assignment', () => {
      const u = new UserAggregate(buildData());
      u.assignDepartment(99);
      expect(u.getDepartmentId()).toBe(99);
    });

    it('sets positionId on assignment', () => {
      const u = new UserAggregate(buildData());
      u.assignPosition(123);
      expect(u.getPositionId()).toBe(123);
    });

    it('overwrites existing departmentId on subsequent call', () => {
      const u = new UserAggregate(buildData({ departmentId: 5 }));
      u.assignDepartment(11);
      expect(u.getDepartmentId()).toBe(11);
    });
  });

  describe('resetPassword()', () => {
    it('replaces passwordHash in persistence snapshot', () => {
      const u = new UserAggregate(buildData({ passwordHash: '$2b$10$old' }));
      u.resetPassword('$2b$10$new');
      expect(u.toPersistence().passwordHash).toBe('$2b$10$new');
    });

    it('updates updatedAt timestamp on password reset', () => {
      const oldDate = new Date('2026-01-01T00:00:00Z');
      const u = new UserAggregate(buildData({ updatedAt: oldDate }));
      u.resetPassword('$2b$10$brandnew');
      const snap = u.toPersistence();
      expect(snap.updatedAt.getTime()).toBeGreaterThanOrEqual(oldDate.getTime());
    });
  });

  describe('toPersistence()', () => {
    it('returns object with all 11 expected keys', () => {
      const u = new UserAggregate(buildData());
      const snap = u.toPersistence();
      expect(Object.keys(snap).sort()).toEqual([
        'createdAt', 'departmentId', 'email', 'id', 'isActive', 'lastLogin',
        'passwordHash', 'positionId', 'role', 'updatedAt', 'username',
      ]);
    });

    it('round-trips data through constructor and toPersistence', () => {
      const data = buildData({ id: 42, role: UserRole.DIRECTOR, departmentId: 3 });
      const u = new UserAggregate(data);
      const out = u.toPersistence();
      expect(out.id).toBe(42);
      expect(out.role).toBe(UserRole.DIRECTOR);
      expect(out.departmentId).toBe(3);
    });
  });
});
