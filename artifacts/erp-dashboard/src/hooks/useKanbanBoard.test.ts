/**
 * @module useKanbanBoard.test
 * @description Vitest tests for the useKanbanBoard state container.
 */

import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>(
    '@/lib/queryClient',
  );
  return { ...actual, apiRequest: vi.fn() };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { apiRequest } from '@/lib/queryClient';
import { useKanbanBoard } from './useKanbanBoard';

const mockedApi = vi.mocked(apiRequest);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        queryFn: async ({ queryKey }) => {
          const [url] = queryKey as [string];
          return mockedApi('GET', url);
        },
      },
      mutations: { retry: false },
    },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('useKanbanBoard state container', () => {
  beforeEach(() => {
    mockedApi.mockReset();
    mockedApi.mockResolvedValue([]);
  });

  it('initialises with defaults: no board, kanban view, role=all', () => {
    const { result } = renderHook(() => useKanbanBoard(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.selectedBoardId).toBeNull();
    expect(result.current.viewMode).toBe('kanban');
    expect(result.current.roleFilter).toBe('all');
    expect(result.current.activeCardId).toBeNull();
  });

  it('initialises filters to empty/null values', () => {
    const { result } = renderHook(() => useKanbanBoard(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.filters.search).toBe('');
    expect(result.current.filters.priority).toBeNull();
    expect(result.current.filters.assigneeId).toBeNull();
    expect(result.current.filters.overdue).toBe(false);
  });

  it('setViewMode updates the view mode', () => {
    const { result } = renderHook(() => useKanbanBoard(), {
      wrapper: makeWrapper(),
    });
    act(() => {
      result.current.setViewMode('deadline');
    });
    expect(result.current.viewMode).toBe('deadline');
  });

  it('setSelectedBoardId stores the value as a string', () => {
    const { result } = renderHook(() => useKanbanBoard(), {
      wrapper: makeWrapper(),
    });
    act(() => {
      result.current.setSelectedBoardId(42);
    });
    expect(result.current.selectedBoardId).toBe('42');
  });

  it('setNewBoardName and setNewColumnName update string state', () => {
    const { result } = renderHook(() => useKanbanBoard(), {
      wrapper: makeWrapper(),
    });
    act(() => {
      result.current.setNewBoardName('Production');
      result.current.setNewColumnName('Backlog');
    });
    expect(result.current.newBoardName).toBe('Production');
    expect(result.current.newColumnName).toBe('Backlog');
  });

  it('setFilters accepts an updater function form', () => {
    const { result } = renderHook(() => useKanbanBoard(), {
      wrapper: makeWrapper(),
    });
    act(() => {
      result.current.setFilters((prev) => ({ ...prev, search: 'rush' }));
    });
    expect(result.current.filters.search).toBe('rush');
  });

  it('starts with hasActiveFilters=false when no filters set', () => {
    const { result } = renderHook(() => useKanbanBoard(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('auto-selects the first available board when boards load', async () => {
    mockedApi.mockReset();
    mockedApi.mockImplementation(async (_method: string, url: string) => {
      if (url === '/api/kanban/boards') return [{ id: 'b-100', name: 'B1' }];
      return [];
    });
    const { result } = renderHook(() => useKanbanBoard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.selectedBoardId).toBe('b-100'));
  });
});
