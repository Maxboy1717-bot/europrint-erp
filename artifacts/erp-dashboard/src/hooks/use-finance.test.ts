/**
 * @module use-finance.test
 * @description Vitest tests for Finance React Query hooks.
 */

import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>(
    '@/lib/queryClient',
  );
  return {
    ...actual,
    apiRequest: vi.fn(),
    queryClient: new QueryClient({
      defaultOptions: { queries: { gcTime: 0,  retry: false }, mutations: { retry: false } },
    }),
  };
});

import { apiRequest } from '@/lib/queryClient';
import {
  useFinanceDashboard,
  useBudgets,
  useApproveBudget,
  useCreateInvoice,
} from './use-finance';

const mockedApiRequest = vi.mocked(apiRequest);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        queryFn: async ({ queryKey }) => {
          const [url] = queryKey as [string, unknown?];
          return mockedApiRequest('GET', url);
        },
      },
      mutations: { retry: false },
    },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('use-finance hooks', () => {
  beforeEach(() => mockedApiRequest.mockReset());

  it('returns dashboard data when API succeeds', async () => {
    mockedApiRequest.mockResolvedValueOnce({ revenue: 1000 });
    const { result } = renderHook(() => useFinanceDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ revenue: 1000 });
  });

  it('exposes loading state when dashboard fetch is pending', async () => {
    // Use a Promise that resolves on the next macrotask. The test assertion
    // captures `isLoading: true` at the initial synchronous render, which
    // happens BEFORE the Promise resolves — so the assertion is still valid.
    // Using a resolving Promise (instead of forever-pending) lets vitest's
    // cleanup phase complete promptly under Vitest 4 + React 19.
    mockedApiRequest.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useFinanceDashboard(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when budgets API rejects', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useBudgets('approved'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('500');
  });

  it('refetches dashboard when refetch is invoked', async () => {
    let __refetched: unknown;
    mockedApiRequest
      .mockResolvedValueOnce({ revenue: 100 })
      .mockResolvedValueOnce({ revenue: 200 });
    const { result } = renderHook(() => useFinanceDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual({ revenue: 200 });
  });

  it('calls approve budget endpoint when mutation runs', async () => {
    mockedApiRequest.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useApproveBudget(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync('B-1');
    });
    expect(mockedApiRequest).toHaveBeenCalledWith(
      'PATCH',
      '/api/finance/budgets/B-1/approve',
      {},
    );
  });

  it('surfaces error when create invoice mutation rejects', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('invalid amount'));
    const { result } = renderHook(() => useCreateInvoice(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ amount: -1 });
      }),
    ).rejects.toThrow('invalid amount');
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
