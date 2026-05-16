/**
 * test/auth/auth-user.aggregate.spec.ts
 * Unit tests for AuthUserAggregate — login state, lockout policy,
 * failed-attempt counter, and password change handshake.
 */
import * as bcrypt from 'bcrypt';
import { AuthUserAggregate, AuthUserData } from '../../src/modules/auth/domain/aggregates/auth-user.aggregate';
import { PasswordValueObject } from '../../src/modules/auth/domain/value-objects/password.vo';
import { userFactory } from '../_fixtures/factories';

// bcrypt hash of "Original#1" — used as the initial password for change-password tests.
const ORIGINAL_PASSWORD = 'Original#1';
let originalHash = '';
let originalVo: PasswordValueObject;
let replacementVo: PasswordValueObject;

beforeAll(async () => {
  originalHash = await bcrypt.hash(ORIGINAL_PASSWORD, 4);
  originalVo = PasswordValueObject.createFromHash(originalHash);
  replacementVo = PasswordValueObject.createFromHash(await bcrypt.hash('Replacement#9', 4));
});

function buildData(overrides: Partial<AuthUserData> = {}): AuthUserData {
  const f = userFactory();
  return {
    id: f.id,
    username: f.username,
    email: f.email,
    passwordHash: originalHash,
    isActive: true,
    lastLogin: null,
    failedLoginAttempts: 0,
    lockUntil: null,
    ...overrides,
  };
}

describe('AuthUserAggregate', () => {
  describe('static create()', () => {
    it('produces active user with zero failed attempts', () => {
      const u = AuthUserAggregate.create('alice', 'a@e.uz', originalVo);
      expect(u.getUsername()).toBe('alice');
      expect(u.getEmail()).toBe('a@e.uz');
      expect(u.isAccountActive()).toBe(true);
      expect(u.getFailedLoginAttempts()).toBe(0);
    });

    it('defaults role to "employee" when not provided', () => {
      const u = AuthUserAggregate.create('bob', 'b@e.uz', originalVo);
      expect(u.getRole()).toBe('employee');
    });
  });

  describe('constructor()', () => {
    it('uses provided role when data.role is set', () => {
      const u = new AuthUserAggregate(buildData({ role: 'admin' }));
      expect(u.getRole()).toBe('admin');
    });

    it('falls back to "employee" when role is undefined', () => {
      const u = new AuthUserAggregate(buildData({ role: undefined }));
      expect(u.getRole()).toBe('employee');
    });
  });

  describe('verifyPassword()', () => {
    it('returns true when plain matches stored hash', async () => {
      const u = new AuthUserAggregate(buildData());
      const ok = await u.verifyPassword(ORIGINAL_PASSWORD);
      expect(ok).toBe(true);
    });

    it('returns false when plain differs from stored hash', async () => {
      const u = new AuthUserAggregate(buildData());
      const ok = await u.verifyPassword('WrongPass#1');
      expect(ok).toBe(false);
    });
  });

  describe('incrementFailedAttempts()', () => {
    it('bumps counter by one each call', () => {
      const u = new AuthUserAggregate(buildData({ failedLoginAttempts: 2 }));
      u.incrementFailedAttempts();
      u.incrementFailedAttempts();
      expect(u.getFailedLoginAttempts()).toBe(4);
    });
  });

  describe('lockAccount() / isAccountLocked()', () => {
    it('reports locked when lockUntil is in the future', () => {
      const u = new AuthUserAggregate(buildData());
      u.lockAccount(30);
      expect(u.isAccountLocked()).toBe(true);
    });

    it('reports NOT locked when lockUntil is null', () => {
      const u = new AuthUserAggregate(buildData({ lockUntil: null }));
      expect(u.isAccountLocked()).toBe(false);
    });

    it('reports NOT locked when lockUntil is in the past', () => {
      const past = new Date(Date.now() - 60_000);
      const u = new AuthUserAggregate(buildData({ lockUntil: past }));
      expect(u.isAccountLocked()).toBe(false);
    });

    it('uses default 30-minute duration when no arg given', () => {
      const u = new AuthUserAggregate(buildData());
      const before = Date.now();
      u.lockAccount();
      // verify lock projected ~30 min ahead by checking via re-export
      const snap = u.toPersistence();
      const lockMs = snap.lockUntil?.getTime() ?? 0;
      expect(lockMs - before).toBeGreaterThan(25 * 60_000);
      expect(lockMs - before).toBeLessThan(35 * 60_000);
    });
  });

  describe('resetFailedAttempts()', () => {
    it('clears counter and lockUntil', () => {
      const u = new AuthUserAggregate(buildData({ failedLoginAttempts: 5 }));
      u.lockAccount(15);
      u.resetFailedAttempts();
      expect(u.getFailedLoginAttempts()).toBe(0);
      expect(u.isAccountLocked()).toBe(false);
    });
  });

  describe('updateLastLogin() / getLastLogin()', () => {
    it('stores and returns the provided timestamp', () => {
      const u = new AuthUserAggregate(buildData());
      const ts = new Date('2026-06-15T10:00:00Z');
      u.updateLastLogin(ts);
      expect(u.getLastLogin()).toEqual(ts);
    });

    it('returns null before any login is recorded', () => {
      const u = new AuthUserAggregate(buildData({ lastLogin: null }));
      expect(u.getLastLogin()).toBeNull();
    });
  });

  describe('changePassword()', () => {
    it('returns true and swaps hash when old password is correct', async () => {
      const u = new AuthUserAggregate(buildData());
      const ok = await u.changePassword(ORIGINAL_PASSWORD, replacementVo);
      expect(ok).toBe(true);
      // new password now verifies
      const verified = await u.verifyPassword('Replacement#9');
      expect(verified).toBe(true);
    });

    it('returns false and keeps hash when old password is wrong', async () => {
      const u = new AuthUserAggregate(buildData());
      const ok = await u.changePassword('WrongOld#1', replacementVo);
      expect(ok).toBe(false);
      const stillOriginal = await u.verifyPassword(ORIGINAL_PASSWORD);
      expect(stillOriginal).toBe(true);
    });
  });

  describe('toPersistence()', () => {
    it('preserves id and username through round-trip', () => {
      const u = new AuthUserAggregate(buildData({ id: 77, username: 'roundtrip' }));
      const snap = u.toPersistence();
      expect(snap.id).toBe(77);
      expect(snap.username).toBe('roundtrip');
    });
  });
});
