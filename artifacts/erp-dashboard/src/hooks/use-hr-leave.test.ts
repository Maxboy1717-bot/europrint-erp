/**
 * @module use-hr-leave.test
 * @description Vitest tests for HR Leave hooks.
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
  useLeaveTypes,
  useLeaveRequests,
  useCreateLeaveRequest,
  useApproveLeave,
  useRejectLeave,
} from './use-hr-leave';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { gcTime: 0,  retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-hr-leave hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns leave types when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1, name: 'Annual' }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => useLeaveTypes(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, name: 'Annual' }]);
  });

  it('exposes loading state while requests fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useLeaveRequests(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when requests fetch rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('forbidden'));
    const { result } = renderHook(() => useLeaveRequests(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('forbidden');
  });

  it('refetches leave requests when refetch is called', async () => {
    let __refetched: unknown;
    mockedFetchApi
      .mockResolvedValueOnce({ data: [{ id: 1 }], ok: true, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], ok: true, status: 200 });
    const { result } = renderHook(() => useLeaveRequests(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('creates leave request via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreateLeaveRequest(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ employeeId: 1, days: 5 });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/leave/requests', {
      method: 'POST',
      body: JSON.stringify({ employeeId: 1, days: 5 }),
    });
  });

  it('calls approve endpoint with id', async () => {
    mockedFetchApi.mockResolvedValueOnce({ data: {}, ok: true, status: 200 });
    const { result } = renderHook(() => useApproveLeave(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync(42);
    });
    expect(mockedFetchApi).toHaveBeenCalledWith(
      '/hr/leave/requests/42/approve',
      { method: 'PUT' },
    );
  });

  it('surfaces error when reject mutation fails', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('already processed'));
    const { result } = renderHook(() => useRejectLeave(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ id: 1, reason: 'nope' });
      }),
    ).rejects.toThrow('already processed');
  });
});
