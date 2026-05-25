/**
 * @module use-hr-payroll.test
 * @description Vitest tests for HR Payroll hooks.
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
  usePayrollPeriods,
  useCreatePayrollPeriod,
  useCalculatePayroll,
  useApprovePayroll,
  useLockPayrollPeriod,
} from './use-hr-payroll';

const mockedFetchApi = vi.mocked(fetchApi);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { gcTime: 0,  retry: false }, mutations: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-hr-payroll hooks', () => {
  beforeEach(() => mockedFetchApi.mockReset());

  it('returns periods list when API succeeds', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: [{ id: 1, period: '2025-01' }],
      ok: true,
      status: 200,
    });
    const { result } = renderHook(() => usePayrollPeriods(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, period: '2025-01' }]);
  });

  it('exposes loading state while periods fetch is pending', async () => {
    mockedFetchApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => usePayrollPeriods(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when periods API rejects', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('db error'));
    const { result } = renderHook(() => usePayrollPeriods(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('db error');
  });

  it('refetches periods when refetch is called', async () => {
    let __refetched: unknown;
    mockedFetchApi
      .mockResolvedValueOnce({ data: [{ id: 1 }], ok: true, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], ok: true, status: 200 });
    const { result } = renderHook(() => usePayrollPeriods(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('creates payroll period via mutation', async () => {
    mockedFetchApi.mockResolvedValueOnce({
      data: { id: 1 },
      ok: true,
      status: 201,
    });
    const { result } = renderHook(() => useCreatePayrollPeriod(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ period: '2025-02' });
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/payroll/periods', {
      method: 'POST',
      body: JSON.stringify({ period: '2025-02' }),
    });
  });

  it('calls calculate endpoint with periodId', async () => {
    mockedFetchApi.mockResolvedValueOnce({ data: {}, ok: true, status: 200 });
    const { result } = renderHook(() => useCalculatePayroll(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync(7);
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/payroll/calculate', {
      method: 'POST',
      body: JSON.stringify({ periodId: 7 }),
    });
  });

  it('surfaces error when approve mutation fails', async () => {
    mockedFetchApi.mockRejectedValueOnce(new Error('locked period'));
    const { result } = renderHook(() => useApprovePayroll(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync(1);
      }),
    ).rejects.toThrow('locked period');
  });

  it('locks period via mutation when called', async () => {
    mockedFetchApi.mockResolvedValueOnce({ data: {}, ok: true, status: 200 });
    const { result } = renderHook(() => useLockPayrollPeriod(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync(3);
    });
    expect(mockedFetchApi).toHaveBeenCalledWith('/hr/payroll/lock', {
      method: 'POST',
      body: JSON.stringify({ periodId: 3 }),
    });
  });
});
