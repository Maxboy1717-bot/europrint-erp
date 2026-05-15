/**
 * @module use-hr-kpi.test
 * @description Vitest tests for HR KPI hooks.
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
  useDailyKpi,
  useCreateDailyKpi,
  useGoals,
  useCreateGoal,
  useProductivity,
} from './use-hr-kpi';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { gcTime: 0,  retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-hr-kpi hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns daily kpi entries when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1, score: 88 }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => useDailyKpi(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, score: 88 }]);
  });

  it('exposes loading state while goals fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useGoals(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when daily kpi rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useDailyKpi(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('500');
  });

  it('refetches productivity when refetch is invoked', async () => {
    let __refetched: unknown;
    mockedFetchApi
      .mockResolvedValueOnce({ data: { score: 1 }, ok: true, status: 200 })
      .mockResolvedValueOnce({ data: { score: 2 }, ok: true, status: 200 });
    const { result } = renderHook(() => useProductivity(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual({ score: 2 });
  });

  it('creates daily kpi via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateDailyKpi(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ employeeId: 1, score: 90 });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/kpi/daily', {
      method: 'POST',
      body: JSON.stringify({ employeeId: 1, score: 90 }),
    });
  });

  it('surfaces error when create goal mutation rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('invalid'));
    const { result } = renderHook(() => useCreateGoal(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ name: 'Q1' });
      }),
    ).rejects.toThrow('invalid');
  });
});
