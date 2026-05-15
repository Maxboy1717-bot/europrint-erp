/**
 * @module use-safety.test
 * @description Vitest tests for Safety React Query hooks.
 */

import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/utils', () => ({
  fetchApi: vi.fn(),
  cn: (...args: unknown[]) => args.join(' '),
}));

import { fetchApi } from '@/lib/utils';
import { useIncidents, useCreateIncident } from './use-safety';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { gcTime: 0,  retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-safety hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns incidents when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1, severity: 'low' }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => useIncidents(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, severity: 'low' }]);
  });

  it('exposes loading state while incidents fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useIncidents(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when incidents API rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('forbidden'));
    const { result } = renderHook(() => useIncidents(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('forbidden');
  });

  it('refetches incidents when refetch is called', async () => {
    let __refetched: unknown;
    mockedFetchApi
      .mockResolvedValueOnce({ data: [{ id: 1 }], ok: true, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], ok: true, status: 200 });
    const { result } = renderHook(() => useIncidents(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('creates incident via mutation when called', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateIncident(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ severity: 'high', area: 'sex-1' });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/safety/incidents', {
      method: 'POST',
      body: JSON.stringify({ severity: 'high', area: 'sex-1' }),
    });
  });

  it('surfaces error when create incident mutation rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('invalid payload'));
    const { result } = renderHook(() => useCreateIncident(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({});
      }),
    ).rejects.toThrow('invalid payload');
  });
});
