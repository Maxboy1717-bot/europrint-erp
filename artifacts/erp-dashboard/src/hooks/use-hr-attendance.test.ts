/**
 * @module use-hr-attendance.test
 * @description Vitest tests for HR Attendance hooks.
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
  useAttendance,
  useAttendanceSummary,
  useCheckIn,
  useRunAbcAnalysis,
} from './use-hr-attendance';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { gcTime: 0,  retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-hr-attendance hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns attendance entries when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1, present: true }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => useAttendance(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, present: true }]);
  });

  it('exposes loading state while attendance fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useAttendance(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when summary API rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useAttendanceSummary(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('boom');
  });

  it('refetches attendance when refetch is called', async () => {
    let __refetched: unknown;
    mockedFetchApi
      .mockResolvedValueOnce({ data: [{ id: 1 }], ok: true, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], ok: true, status: 200 });
    const { result } = renderHook(() => useAttendance(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('builds query string when params are provided', async () => {
    mockedFetchApi.mockResolvedValueOnce({ data: [], ok: true, status: 200 });
    const { result } = renderHook(
      () => useAttendance({ date: '2025-01-01', employeeId: 5 }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedFetchApi).toHaveBeenCalledWith(
      '/hr/attendance?date=2025-01-01&emp_id=5',
    );
  });

  it('calls check-in endpoint when mutation succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({ data: {}, ok: true, status: 200 });
    const { result } = renderHook(() => useCheckIn(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ employeeId: 1 });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ employeeId: 1 }),
    });
  });

  it('surfaces error when run ABC mutation fails', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('compute failed'));
    const { result } = renderHook(() => useRunAbcAnalysis(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync();
      }),
    ).rejects.toThrow('compute failed');
  });
});
