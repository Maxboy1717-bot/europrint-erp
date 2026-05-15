/**
 * @module useWarehousePosSync.test
 * @description Vitest tests for the warehouse ↔ POS sync hook (normalisation paths).
 */

import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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
import { useWarehousePosSync } from './useWarehousePosSync';

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

describe('useWarehousePosSync', () => {
  beforeEach(() => mockedApi.mockReset());

  it('normalises snake_case warehouse payload', async () => {
    mockedApi.mockResolvedValueOnce([
      { id: 1, warehouse_code: 'WH-A', warehouse_name: 'Main', is_active: true },
    ]);
    const { result } = renderHook(() => useWarehousePosSync(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isWarehousesLoading).toBe(false));
    expect(result.current.warehouses).toEqual([
      expect.objectContaining({ id: '1', code: 'WH-A', name: 'Main', isActive: true }),
    ]);
  });

  it('drops invalid warehouse entries that lack required fields', async () => {
    mockedApi.mockResolvedValueOnce([
      { id: 1, code: 'A', name: 'Ok' },
      { id: null, code: null },
      'not-an-object',
    ]);
    const { result } = renderHook(() => useWarehousePosSync(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isWarehousesLoading).toBe(false));
    expect(result.current.warehouses).toHaveLength(1);
    expect(result.current.warehouses[0].id).toBe('1');
  });

  it('defaults isActive to true when not provided', async () => {
    mockedApi.mockResolvedValueOnce([{ id: 9, code: 'X', name: 'Y' }]);
    const { result } = renderHook(() => useWarehousePosSync(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isWarehousesLoading).toBe(false));
    expect(result.current.warehouses[0].isActive).toBe(true);
  });

  it('returns empty list when API returns null', async () => {
    mockedApi.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useWarehousePosSync(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isWarehousesLoading).toBe(false));
    expect(result.current.warehouses).toEqual([]);
  });

  it('reports zero stock total when no warehouseId is supplied', () => {
    const { result } = renderHook(() => useWarehousePosSync(undefined), {
      wrapper: makeWrapper(),
    });
    expect(result.current.stock).toEqual([]);
    expect(result.current.stockTotal).toBe(0);
  });
});
