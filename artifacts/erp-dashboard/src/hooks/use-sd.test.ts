/**
 * @module use-sd.test
 * @description Vitest tests for Sales & Distribution React Query hooks.
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
  useSDDashboard,
  useSDOrders,
  useCreateOrder,
  useAdvanceOrderStatus,
} from './use-sd';

const mockedApiRequest = vi.mocked(apiRequest);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        queryFn: async ({ queryKey }) => {
          const [url] = queryKey as [string];
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

describe('use-sd hooks', () => {
  beforeEach(() => mockedApiRequest.mockReset());

  it('returns dashboard data when API succeeds', async () => {
    mockedApiRequest.mockResolvedValueOnce({ revenue: 12000 });
    const { result } = renderHook(() => useSDDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ revenue: 12000 });
  });

  it('exposes loading state while orders fetch is pending', async () => {
    mockedApiRequest.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useSDOrders(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when dashboard fetch rejects', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('sd offline'));
    const { result } = renderHook(() => useSDDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('sd offline');
  });

  it('refetches orders when refetch is called', async () => {
    let __refetched: unknown;
    mockedApiRequest
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 2 }]);
    const { result } = renderHook(() => useSDOrders(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('creates order via mutation when called', async () => {
    mockedApiRequest.mockResolvedValueOnce({ id: 99 });
    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ customerId: 1 });
    });
    expect(mockedApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/sd/orders',
      { customerId: 1 },
    );
  });

  it('surfaces error when advance status mutation fails', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('invalid transition'));
    const { result } = renderHook(() => useAdvanceOrderStatus(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ id: 1, status: 'shipped' });
      }),
    ).rejects.toThrow('invalid transition');
  });
});
