/**
 * @module use-mes.test
 * @description Vitest tests for MES React Query hooks.
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
  useMESDashboard,
  useMESDowntimes,
  useStartSession,
  useRecordDowntime,
} from './use-mes';

const mockedApiRequest = vi.mocked(apiRequest);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchInterval: false,
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

describe('use-mes hooks', () => {
  beforeEach(() => mockedApiRequest.mockReset());

  it('returns dashboard stats when API succeeds', async () => {
    mockedApiRequest.mockResolvedValueOnce({ oee: 78 });
    const { result } = renderHook(() => useMESDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ oee: 78 });
  });

  it('exposes loading state while dashboard fetch is pending', async () => {
    mockedApiRequest.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useMESDashboard(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when dashboard fetch rejects', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('mes down'));
    const { result } = renderHook(() => useMESDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('mes down');
  });

  it('refetches downtimes when refetch is called', async () => {
    let __refetched: unknown;
    mockedApiRequest
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 2 }]);
    const { result } = renderHook(() => useMESDowntimes('s1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('starts session via mutation when called', async () => {
    mockedApiRequest.mockResolvedValueOnce({ sessionId: 'abc' });
    const { result } = renderHook(() => useStartSession(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ machineId: 'M1' });
    });
    expect(mockedApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/mes/sessions/start',
      { machineId: 'M1' },
    );
  });

  it('surfaces error when record downtime mutation fails', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('locked'));
    const { result } = renderHook(() => useRecordDowntime(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ sessionId: 's1', data: { reason: 'jam' } });
      }),
    ).rejects.toThrow('locked');
  });
});
