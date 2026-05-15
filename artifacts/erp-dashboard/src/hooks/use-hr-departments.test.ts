/**
 * @module use-hr-departments.test
 * @description Vitest tests for HR Departments hooks.
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
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from './use-hr-departments';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { gcTime: 0,  retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-hr-departments hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns department list when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1, name: 'IT' }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => useDepartments(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, name: 'IT' }]);
  });

  it('exposes loading state while departments fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useDepartments(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when departments API rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useDepartments(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('network');
  });

  it('refetches departments when refetch is called', async () => {
    let __refetched: unknown;
    mockedFetchApi
      .mockResolvedValueOnce({ data: [{ id: 1 }], ok: true, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], ok: true, status: 200 });
    const { result } = renderHook(() => useDepartments(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('calls create endpoint when create mutation runs', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateDepartment(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ name: 'QA' });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/departments', {
      method: 'POST',
      body: JSON.stringify({ name: 'QA' }),
    });
  });

  it('calls update endpoint with id when update mutation runs', async () => {
    mockedFetchApi.mockResolvedValueOnce({ data: {}, ok: true, status: 200 });
    const { result } = renderHook(() => useUpdateDepartment(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ id: 5, name: 'New' });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/departments/5', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New' }),
    });
  });

  it('surfaces delete mutation error when API rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('403'));
    const { result } = renderHook(() => useDeleteDepartment(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync(7);
      }),
    ).rejects.toThrow('403');
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
