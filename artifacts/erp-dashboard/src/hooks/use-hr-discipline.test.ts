/**
 * @module use-hr-discipline.test
 * @description Vitest tests for HR Discipline hooks.
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
  useDisciplineRecords,
  useCreateDisciplineRecord,
  useUpdateDisciplineRecord,
  useDeleteDisciplineRecord,
  useCreateAppeal,
} from './use-hr-discipline';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { gcTime: 0,  retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-hr-discipline hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns records when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1 }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => useDisciplineRecords(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('exposes loading state while records fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useDisciplineRecords(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when records API rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('403'));
    const { result } = renderHook(() => useDisciplineRecords(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('403');
  });

  it('refetches records when refetch is called', async () => {
    let __refetched: unknown;
    mockedFetchApi
      .mockResolvedValueOnce({ data: [{ id: 1 }], ok: true, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], ok: true, status: 200 });
    const { result } = renderHook(() => useDisciplineRecords(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('creates record via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateDisciplineRecord(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ employeeId: 1 });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/discipline', {
      method: 'POST',
      body: JSON.stringify({ employeeId: 1 }),
    });
  });

  it('updates record via mutation with id in url', async () => {
    mockedFetchApi.mockResolvedValueOnce({ data: {}, ok: true, status: 200 });
    const { result } = renderHook(() => useUpdateDisciplineRecord(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ id: 4, severity: 'high' });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/discipline/4', {
      method: 'PUT',
      body: JSON.stringify({ severity: 'high' }),
    });
  });

  it('surfaces error when delete mutation fails', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('forbidden'));
    const { result } = renderHook(() => useDeleteDisciplineRecord(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync(8);
      }),
    ).rejects.toThrow('forbidden');
  });

  it('creates appeal via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateAppeal(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ recordId: 4, reason: 'unfair' });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/discipline/appeals', {
      method: 'POST',
      body: JSON.stringify({ recordId: 4, reason: 'unfair' }),
    });
  });
});
