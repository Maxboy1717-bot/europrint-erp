/**
 * @module use-hr-assessment.test
 * @description Vitest tests for HR Assessment hooks.
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
  useAssessments360,
  useCreateAssessment360,
  useSuccessionPlans,
  useCreateSuccessionPlan,
  useTransfers,
  useCreateTransfer,
  useNineBox,
} from './use-hr-assessment';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { gcTime: 0,  retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-hr-assessment hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns 360 assessments when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1 }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => useAssessments360(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('exposes loading state while nine-box fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useNineBox(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when succession plans API rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useSuccessionPlans(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('500');
  });

  it('refetches transfers when refetch is invoked', async () => {
    let __refetched: unknown;
    mockedFetchApi
      .mockResolvedValueOnce({ data: [{ id: 1 }], ok: true, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], ok: true, status: 200 });
    const { result } = renderHook(() => useTransfers(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('creates 360 assessment via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateAssessment360(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ employeeId: 1 });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/assessment/360', {
      method: 'POST',
      body: JSON.stringify({ employeeId: 1 }),
    });
  });

  it('creates succession plan via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateSuccessionPlan(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ positionId: 1, successorId: 2 });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith(
      '/hr/assessment/succession-plans',
      {
        method: 'POST',
        body: JSON.stringify({ positionId: 1, successorId: 2 }),
      },
    );
  });

  it('surfaces error when create transfer mutation fails', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('invalid'));
    const { result } = renderHook(() => useCreateTransfer(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ employeeId: 1, toDept: 'IT' });
      }),
    ).rejects.toThrow('invalid');
  });
});
