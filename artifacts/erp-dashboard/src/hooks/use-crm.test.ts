/**
 * @module use-crm.test
 * @description Vitest tests for CRM React Query hooks.
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

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { apiRequest } from '@/lib/queryClient';
import {
  useCRMDashboard,
  useCRMLeads,
  useCreateLead,
  useQualifyLead,
} from './use-crm';

const mockedApiRequest = vi.mocked(apiRequest);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
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

describe('use-crm hooks', () => {
  beforeEach(() => {
    mockedApiRequest.mockReset();
  });

  it('returns dashboard data when API succeeds', async () => {
    mockedApiRequest.mockResolvedValueOnce({ totalLeads: 42 });
    const { result } = renderHook(() => useCRMDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ totalLeads: 42 });
  });

  it('exposes loading state when fetch is pending', async () => {
    mockedApiRequest.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useCRMDashboard(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    unmount();
  });

  it('returns error state when dashboard API rejects', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('crm down'));
    const { result } = renderHook(() => useCRMDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('crm down');
  });

  it('refetches dashboard data when refetch is called', async () => {
    let __refetched: unknown;
    mockedApiRequest
      .mockResolvedValueOnce({ totalLeads: 1 })
      .mockResolvedValueOnce({ totalLeads: 2 });
    const { result } = renderHook(() => useCRMDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual({ totalLeads: 2 });
    expect(mockedApiRequest).toHaveBeenCalledTimes(2);
  });

  it('coerces leads response to array via safeArray', async () => {
    mockedApiRequest.mockResolvedValueOnce({ leads: [{ id: 1 }, { id: 2 }] });
    const { result } = renderHook(() => useCRMLeads(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('runs create lead mutation when triggered', async () => {
    mockedApiRequest.mockResolvedValueOnce({ id: 99 });
    const { result } = renderHook(() => useCreateLead(), {
      wrapper: makeWrapper(),
    });
    let mutationResult: unknown;
    await act(async () => {
      mutationResult = await result.current.mutateAsync({ name: 'Acme' });
    });
    expect(mockedApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/crm/leads',
      { name: 'Acme' },
    );
    expect(mutationResult).toEqual({ id: 99 });
  });

  it('surfaces mutation error when qualify lead API fails', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('forbidden'));
    const { result } = renderHook(() => useQualifyLead(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync({ id: 1, score: 90 });
      }),
    ).rejects.toThrow('forbidden');
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
