/**
 * @module use-qc.test
 * @description Vitest tests for QC React Query hooks.
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
  useQCDashboard,
  useQCDefects,
  useCreateDefect,
  useResolveDefect,
} from './use-qc';

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

describe('use-qc hooks', () => {
  beforeEach(() => mockedApiRequest.mockReset());

  it('returns dashboard data when API succeeds', async () => {
    mockedApiRequest.mockResolvedValueOnce({ openDefects: 3 });
    const { result } = renderHook(() => useQCDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ openDefects: 3 });
  });

  it('exposes loading state while defects fetch is pending', async () => {
    mockedApiRequest.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useQCDefects(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when dashboard rejects', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('qc down'));
    const { result } = renderHook(() => useQCDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('qc down');
  });

  it('selects defects array via safeArray and refetches', async () => {
    mockedApiRequest
      .mockResolvedValueOnce({ defects: [{ id: 1 }] })
      .mockResolvedValueOnce({ defects: [{ id: 2 }] });
    const { result } = renderHook(() => useQCDefects(), {
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

  it('creates defect when mutation succeeds', async () => {
    mockedApiRequest.mockResolvedValueOnce({ id: 5 });
    const { result } = renderHook(() => useCreateDefect(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ description: 'crack' });
    });
    expect(mockedApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/qc/defects',
      { description: 'crack' },
    );
  });

  it('surfaces error when resolve defect mutation rejects', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('cannot resolve'));
    const { result } = renderHook(() => useResolveDefect(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ id: 2, status: 'closed' });
      }),
    ).rejects.toThrow('cannot resolve');
  });
});
