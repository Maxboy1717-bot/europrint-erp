import { describe, it, expect } from 'vitest';
import { idleTimeoutMs, type IdleThresholds } from '../IdleLogoutProvider';

const T: IdleThresholds = { oddiyMin: 30, maxfiyMin: 20, judaMaxfiyMin: 15 };

describe('idleTimeoutMs — tighter timeout for more sensitive documents (decision #9)', () => {
  it('oddiy / unknown -> 30 min', () => {
    expect(idleTimeoutMs('oddiy', T)).toBe(30 * 60_000);
    expect(idleTimeoutMs('', T)).toBe(30 * 60_000);
    expect(idleTimeoutMs('anything', T)).toBe(30 * 60_000);
  });
  it('maxfiy -> 20 min', () => {
    expect(idleTimeoutMs('maxfiy', T)).toBe(20 * 60_000);
  });
  it('juda-maxfiy -> 15 min', () => {
    expect(idleTimeoutMs('juda-maxfiy', T)).toBe(15 * 60_000);
  });
  it('honours custom (CRUD-edited) thresholds', () => {
    expect(idleTimeoutMs('maxfiy', { oddiyMin: 60, maxfiyMin: 10, judaMaxfiyMin: 5 })).toBe(10 * 60_000);
  });
  it('never returns a zero/negative timeout', () => {
    expect(idleTimeoutMs('oddiy', { oddiyMin: 0, maxfiyMin: 0, judaMaxfiyMin: 0 })).toBe(60_000);
  });
});
