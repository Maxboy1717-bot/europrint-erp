/**
 * @module use-iot.test
 * @description Vitest tests for IoT React Query hooks.
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
  useIoTDashboard,
  useIoTAnomalies,
  useRecordReading,
} from './use-iot';

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

describe('use-iot hooks', () => {
  beforeEach(() => mockedApiRequest.mockReset());

  it('returns dashboard stats when API succeeds', async () => {
    mockedApiRequest.mockResolvedValueOnce({ devices: 10 });
    const { result } = renderHook(() => useIoTDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ devices: 10 });
  });

  it('exposes loading state while dashboard fetch is pending', async () => {
    mockedApiRequest.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useIoTDashboard(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when anomalies fetch rejects', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('iot offline'));
    const { result } = renderHook(() => useIoTAnomalies(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('iot offline');
  });

  it('refetches anomalies when refetch is called', async () => {
    let __refetched: unknown;
    mockedApiRequest
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 2 }]);
    const { result } = renderHook(() => useIoTAnomalies(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('records reading when mutation succeeds', async () => {
    mockedApiRequest.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useRecordReading(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ deviceId: 'd1', data: { temp: 25 } });
    });
    expect(mockedApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/iot/devices/d1/readings',
      { temp: 25 },
    );
  });

  it('surfaces mutation error when record reading fails', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('sensor offline'));
    const { result } = renderHook(() => useRecordReading(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ deviceId: 'd1', data: {} });
      }),
    ).rejects.toThrow('sensor offline');
  });
});
