/**
 * @module use-kanban.test
 * @description Vitest tests for Kanban React Query hooks.
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
  useKanbanTasks,
  useKanbanBoards,
  useCreateTask,
  useDeleteTask,
} from './use-kanban';

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

describe('use-kanban hooks', () => {
  beforeEach(() => mockedApiRequest.mockReset());

  it('returns kanban tasks array when API succeeds', async () => {
    mockedApiRequest.mockResolvedValueOnce({ tasks: [{ id: 1 }] });
    const { result } = renderHook(() => useKanbanTasks(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('exposes loading state while boards fetch is pending', async () => {
    mockedApiRequest.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useKanbanBoards(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('returns error state when tasks fetch rejects', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('kanban down'));
    const { result } = renderHook(() => useKanbanTasks(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('kanban down');
  });

  it('refetches boards when refetch is invoked', async () => {
    let __refetched: unknown;
    mockedApiRequest
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 2 }]);
    const { result } = renderHook(() => useKanbanBoards(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      const __r = await result.current.refetch(); __refetched = __r.data;
    });
    expect(__refetched).toEqual([{ id: 2 }]);
  });

  it('posts task data when create task mutation succeeds', async () => {
    mockedApiRequest.mockResolvedValueOnce({ id: 10 });
    const { result } = renderHook(() => useCreateTask(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ title: 'X' });
    });
    expect(mockedApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/kanban',
      { title: 'X' },
    );
  });

  it('surfaces error when delete task mutation rejects', async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error('not allowed'));
    const { result } = renderHook(() => useDeleteTask(), {
      wrapper: makeWrapper(),
    });
    await expect(
      act(async () => {
        await result.current.mutateAsync(3);
      }),
    ).rejects.toThrow('not allowed');
  });
});
