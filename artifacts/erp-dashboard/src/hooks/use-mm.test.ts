/**
 * @module use-mm.test
 * @description Vitest tests for Materials Management React Query hooks.
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
  useMMDashboard,
  useMaterials,
  useCreatePurchaseOrder,
  useRunMrp,
} from './use-mm';

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

describe('use-mm hooks', () => {
  beforeEach(() => mockedApiRequest.mockReset());

  it('returns dashboard data when API succeeds', async () => {
    mockedApiRequest.mockResolvedValueOnce({ totalPos: 5 });
    const { result } = renderHook(() => useMMDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ totalPos: 5 });
  });

  it('exposes loading state while materials fetch is pending', async () => {
    mockedApiRequest.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useMaterials(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when dashboard fetch rejects', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('mm down'));
    const { result } = renderHook(() => useMMDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('mm down');
  });

  it('selects materials array from envelope and refetches', async () => {
    mockedApiRequest
      .mockResolvedValueOnce({ materials: [{ id: 1 }] })
      .mockResolvedValueOnce({ materials: [{ id: 2 }] });
    const { result } = renderHook(() => useMaterials(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }]);
    let refetchedData: unknown;
    await act(async () => {
      const r = await result.current.refetch();
      refetchedData = r.data;
    });
    expect(refetchedData).toEqual([{ id: 2 }]);
  });

  it('creates purchase order via mutation', async () => {
    mockedApiRequest.mockResolvedValueOnce({ id: 1 });
    const { result } = renderHook(() => useCreatePurchaseOrder(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ vendorId: 9 });
    });
    expect(mockedApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/mm/purchase-orders',
      { vendorId: 9 },
    );
  });

  it('surfaces error when run MRP mutation fails', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('mrp error'));
    const { result } = renderHook(() => useRunMrp(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync();
      }),
    ).rejects.toThrow('mrp error');
  });
});
