/**
 * @module errorLogger.test
 * @description Vitest tests for the client-side error queue.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logClientError } from '../errorLogger';

describe('logClientError', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  it('schedules a POST to /api/client-errors with the error message', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    logClientError(new Error('boom'), 'TestContext');
    await vi.advanceTimersByTimeAsync(600);
    expect(fetchSpy).toHaveBeenCalled();
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.method).toBe('POST');
    const body = JSON.parse(init?.body as string);
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors[0].message).toBe('boom');
    expect(body.errors[0].context).toBe('TestContext');
  });

  it('stores stack from Error instances', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    logClientError(new Error('with-stack'));
    await vi.advanceTimersByTimeAsync(600);
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    const body = JSON.parse(init?.body as string);
    expect(typeof body.errors[0].stack).toBe('string');
  });

  it('coerces non-Error inputs via String()', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    logClientError('plain string error');
    await vi.advanceTimersByTimeAsync(600);
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    const body = JSON.parse(init?.body as string);
    expect(body.errors[0].message).toBe('plain string error');
    expect(body.errors[0].stack).toBeUndefined();
  });

  it('does not throw when fetch rejects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    expect(() => logClientError('x')).not.toThrow();
    await vi.advanceTimersByTimeAsync(700);
  });

  it('includes timestamp and url metadata', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    logClientError('payload-check');
    await vi.advanceTimersByTimeAsync(600);
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    const body = JSON.parse(init?.body as string);
    expect(typeof body.errors[0].timestamp).toBe('string');
    expect(typeof body.errors[0].url).toBe('string');
  });
});
