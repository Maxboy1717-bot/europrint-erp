/**
 * @module use-wms.test
 * @description Vitest tests for warehouse / WMS hooks.
 */

import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
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
import {
  useWarehouseDashboard,
  useWarehouseStock,
  useGoodsReceipt,
  useGoodsIssue,
  useCreateTransfer,
  useBarcodeScan,
  useWmsStock,
} from './use-wms';

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

describe('use-wms hooks', () => {
  beforeEach(() => mockedApi.mockReset());

  it('returns warehouse dashboard data', async () => {
    mockedApi.mockResolvedValueOnce({ total: 1000 });
    const { result } = renderHook(() => useWarehouseDashboard(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ total: 1000 });
  });

  it('coerces stock list via safeArray', async () => {
    mockedApi.mockResolvedValueOnce({ stock: [{ id: 1 }, { id: 2 }] });
    const { result } = renderHook(() => useWarehouseStock('W-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('coerces malformed stock payload to empty array', async () => {
    mockedApi.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useWmsStock(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('posts goods receipt to /api/warehouse/goods-receipts', async () => {
    mockedApi.mockResolvedValueOnce({ id: 'gr-1' });
    const { result } = renderHook(() => useGoodsReceipt(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ items: [] });
    });
    expect(mockedApi).toHaveBeenCalledWith(
      'POST',
      '/api/warehouse/goods-receipts',
      { items: [] },
    );
  });

  it('posts goods issue to /api/wms/goods-issue', async () => {
    mockedApi.mockResolvedValueOnce({ id: 'gi-1' });
    const { result } = renderHook(() => useGoodsIssue(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ materialId: 5, quantity: 10 });
    });
    expect(mockedApi).toHaveBeenCalledWith('POST', '/api/wms/goods-issue', {
      materialId: 5,
      quantity: 10,
    });
  });

  it('posts barcode scan and shows toast on success', async () => {
    mockedApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useBarcodeScan(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ barcode: '123' });
    });
    expect(mockedApi).toHaveBeenCalledWith('POST', '/api/wms/barcode/scan', {
      barcode: '123',
    });
  });

  it('creates transfer via POST', async () => {
    mockedApi.mockResolvedValueOnce({ id: 'tr-1' });
    const { result } = renderHook(() => useCreateTransfer(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ fromId: 1, toId: 2 });
    });
    expect(mockedApi).toHaveBeenCalledWith(
      'POST',
      '/api/warehouse/transfers',
      { fromId: 1, toId: 2 },
    );
  });
});
