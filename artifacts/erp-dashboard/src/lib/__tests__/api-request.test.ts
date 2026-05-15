/**
 * @module api-request.test
 * @description Vitest tests for apiRequest / HttpError / response unwrappers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpError, apiRequest } from '../api-request';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function emptyResponse(status = 204): Response {
  return new Response(null, { status });
}

describe('HttpError', () => {
  it('extends Error and stores the status code', () => {
    const err = new HttpError(500, 'boom');
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(500);
    expect(err.name).toBe('HttpError');
    expect(err.message).toBe('boom');
  });
});

describe('apiRequest unwrapping', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns plain JSON payload when no envelope is present', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse([1, 2, 3]));
    const out = await apiRequest('GET', '/x');
    expect(out).toEqual([1, 2, 3]);
  });

  it('unwraps { ok: true, data: T } envelope', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ ok: true, data: { id: 7 } }),
    );
    const out = await apiRequest('GET', '/x');
    expect(out).toEqual({ id: 7 });
  });

  it('recursively unwraps double-wrapped { ok, data: { ok, data: T } }', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ ok: true, data: { ok: true, data: [9] } }),
    );
    const out = await apiRequest('GET', '/x');
    expect(out).toEqual([9]);
  });

  it('unwraps legacy { isSuccess, value } shape', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ isSuccess: true, isFailure: false, value: 'ok' }),
    );
    const out = await apiRequest('GET', '/x');
    expect(out).toBe('ok');
  });

  it('throws HttpError when { ok: false } envelope is returned', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ ok: false, error: 'bad request' }),
    );
    await expect(apiRequest('GET', '/x')).rejects.toBeInstanceOf(HttpError);
  });

  it('throws HttpError when { success: false } envelope is returned', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ success: false, error: 'nope' }),
    );
    await expect(apiRequest('GET', '/x')).rejects.toBeInstanceOf(HttpError);
  });

  it('returns undefined for 204 No Content responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(emptyResponse(204));
    const out = await apiRequest('DELETE', '/x');
    expect(out).toBeUndefined();
  });

  it('throws a generic error for 5xx without auth-related envelope', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('server crashed', { status: 500 }),
    );
    await expect(apiRequest('GET', '/x')).rejects.toThrow(/500/);
  });

  it('sends Content-Type: application/json for JSON body', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: null }));
    await apiRequest('POST', '/x', { a: 1 });
    const call = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = call?.headers as Record<string, string> | undefined;
    expect(headers?.['Content-Type']).toBe('application/json');
    expect(typeof call?.body).toBe('string');
  });

  it('does not set JSON Content-Type when body is FormData', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: null }));
    const fd = new FormData();
    fd.append('k', 'v');
    await apiRequest('POST', '/x', fd);
    const call = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = call?.headers as Record<string, string> | undefined;
    expect(headers?.['Content-Type']).toBeUndefined();
  });
});
