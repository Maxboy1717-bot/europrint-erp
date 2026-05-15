/**
 * @module auth-refresh.test
 * @description Vitest tests for auth-refresh helpers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AuthError,
  getAuthHeaders,
  setAuthToken,
  clearAuthToken,
  refreshTokenOnce,
} from '../auth-refresh';

describe('AuthError', () => {
  it('extends Error and carries the status code', () => {
    const err = new AuthError(401, 'no creds');
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(401);
    expect(err.message).toBe('no creds');
    expect(err.name).toBe('AuthError');
  });

  it('supports status codes other than 401', () => {
    expect(new AuthError(403, 'forbidden').status).toBe(403);
  });
});

describe('getAuthHeaders', () => {
  it('returns an empty object (cookie auth model)', () => {
    expect(getAuthHeaders()).toEqual({});
  });

  it('returns a fresh object on each call', () => {
    const a = getAuthHeaders();
    const b = getAuthHeaders();
    expect(a).not.toBe(b);
  });
});

describe('setAuthToken', () => {
  it('is a no-op that does not throw', () => {
    expect(() => setAuthToken('x', 'y')).not.toThrow();
    expect(() => setAuthToken()).not.toThrow();
  });
});

describe('clearAuthToken', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  });

  it('removes legacy localStorage tokens', () => {
    localStorage.setItem('access_token', 'a');
    localStorage.setItem('refresh_token', 'b');
    localStorage.setItem('token', 'c');
    clearAuthToken();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('is safe to call when no tokens are present', () => {
    expect(() => clearAuthToken()).not.toThrow();
  });
});

describe('refreshTokenOnce', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when refresh endpoint succeeds', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);
    const ok = await refreshTokenOnce();
    expect(ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('returns false when refresh endpoint returns non-2xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
    } as Response);
    const ok = await refreshTokenOnce();
    expect(ok).toBe(false);
  });

  it('returns false when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network'));
    const ok = await refreshTokenOnce();
    expect(ok).toBe(false);
  });
});
