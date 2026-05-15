/**
 * @module use-hr-employees.test
 * @description Vitest tests for HR Employees hooks.
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
import {
  useEmployees,
  useEmployee,
  useCreateEmployee,
  useDeleteEmployee,
} from './use-hr-employees';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { gcTime: 0,  retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-hr-employees hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns employees list when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1, name: 'Ali' }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => useEmployees(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, name: 'Ali' }]);
  });

  it('exposes loading state while employees fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useEmployees(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when employees API rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useEmployees(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('500');
  });

  it('refetches employees when refetch is invoked', async () => {
    let __refetched: unknown;
    mockedFetchApi
      .mockResolvedValueOnce({ data: [{ id: 1 }], ok: true, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], ok: true, status: 200 });
    const { result } = renderHook(() => useEmployees(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('does not fetch single employee when id is falsy', () => {
    const { result } = renderHook(() => useEmployee(0), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedFetchApi).not.toHaveBeenCalled();
  });

  it('creates employee when mutation succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateEmployee(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ name: 'Vali' });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/employees', {
      method: 'POST',
      body: JSON.stringify({ name: 'Vali' }),
    });
  });

  it('surfaces error when delete employee mutation rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('referenced'));
    const { result } = renderHook(() => useDeleteEmployee(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync(9);
      }),
    ).rejects.toThrow('referenced');
  });
});
