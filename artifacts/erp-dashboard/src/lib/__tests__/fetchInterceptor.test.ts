/**
 * @module fetchInterceptor.test
 * @description Vitest tests for the installFetchInterceptor patch.
 *
 * NOTE: fetchInterceptor.ts captures `_originalFetch` once at module load,
 * so we mock the global fetch BEFORE importing the module under test and
 * use vi.resetModules() to re-evaluate it with the spied fetch in place.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { getAuthHeadersMock } = vi.hoisted(() => ({
  getAuthHeadersMock: vi.fn(),
}));

vi.mock('../queryClient', () => ({
  getAuthHeaders: () => getAuthHeadersMock(),
}));

const fetchSpy = vi.fn(
  async () => new Response('ok', { status: 200 }),
);
const originalFetch = window.fetch;
window.fetch = fetchSpy as unknown as typeof fetch;

let installFetchInterceptor: () => void;

beforeEach(async () => {
  vi.resetModules();
  getAuthHeadersMock.mockReset();
  fetchSpy.mockClear();
  fetchSpy.mockImplementation(
    async () => new Response('ok', { status: 200 }),
  );
  window.fetch = fetchSpy as unknown as typeof fetch;
  const mod = await import('../fetchInterceptor');
  installFetchInterceptor = mod.installFetchInterceptor;
});

afterEach(() => {
  window.fetch = fetchSpy as unknown as typeof fetch;
});

afterEach(() => {
  // restore at the very end
  window.fetch = originalFetch;
});

describe('installFetchInterceptor', () => {
  it('replaces window.fetch with a patched version', () => {
    const before = window.fetch;
    installFetchInterceptor();
    expect(window.fetch).not.toBe(before);
  });

  it('injects auth headers when calling /api/* URLs', async () => {
    const apiUrl = '/api/foo';
    getAuthHeadersMock.mockReturnValue({ Authorization: 'Bearer X' });
    installFetchInterceptor();
    await window.fetch(apiUrl);
    const init = fetchSpy.mock.calls.at(-1)?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.Authorization).toBe('Bearer X');
  });

  it('does not inject headers for non-/api URLs', async () => {
    getAuthHeadersMock.mockReturnValue({ Authorization: 'Bearer X' });
    installFetchInterceptor();
    await window.fetch('/static/logo.png');
    const init = fetchSpy.mock.calls.at(-1)?.[1] as RequestInit | undefined;
    expect(init?.headers).toBeUndefined();
  });

  it('preserves caller-supplied headers when injecting', async () => {
    const apiUrl = '/api/foo';
    getAuthHeadersMock.mockReturnValue({ Authorization: 'Bearer Y' });
    installFetchInterceptor();
    await window.fetch(apiUrl, { headers: { 'X-Custom': '1' } });
    const init = fetchSpy.mock.calls.at(-1)?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.['X-Custom']).toBe('1');
    expect(headers?.Authorization).toBe('Bearer Y');
  });

  it('does nothing when getAuthHeaders returns empty object', async () => {
    const apiUrl = '/api/foo';
    getAuthHeadersMock.mockReturnValue({});
    installFetchInterceptor();
    await window.fetch(apiUrl);
    const init = fetchSpy.mock.calls.at(-1)?.[1] as RequestInit | undefined;
    expect(init?.headers).toBeUndefined();
  });

  it('treats absolute same-origin /api/ URLs the same as relative ones', async () => {
    getAuthHeadersMock.mockReturnValue({ Authorization: 'Z' });
    installFetchInterceptor();
    await window.fetch(window.location.origin + '/api/foo');
    const init = fetchSpy.mock.calls.at(-1)?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.Authorization).toBe('Z');
  });
});
