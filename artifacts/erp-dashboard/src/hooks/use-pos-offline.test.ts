/**
 * @module use-pos-offline.test
 * @description Vitest tests for the usePosOffline hook (state surface).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const {
  savePendingSaleMock,
  decreaseLocalStockMock,
  getCachedProductsMock,
  getCachedProductByBarcodeMock,
  getAllPendingCountMock,
  syncPendingSalesMock,
  refreshProductCacheMock,
  startOnlineWatcherMock,
  onSyncStatusChangeMock,
  nanoidMock,
} = vi.hoisted(() => ({
  savePendingSaleMock: vi.fn(),
  decreaseLocalStockMock: vi.fn(),
  getCachedProductsMock: vi.fn(),
  getCachedProductByBarcodeMock: vi.fn(),
  getAllPendingCountMock: vi.fn(),
  syncPendingSalesMock: vi.fn(),
  refreshProductCacheMock: vi.fn(),
  startOnlineWatcherMock: vi.fn(),
  onSyncStatusChangeMock: vi.fn(),
  nanoidMock: vi.fn(),
}));

vi.mock('@/lib/pos-db', () => ({
  savePendingSale: (s: unknown) => savePendingSaleMock(s),
  decreaseLocalStock: (id: number, q: number) => decreaseLocalStockMock(id, q),
  getCachedProducts: (s?: string) => getCachedProductsMock(s),
  getCachedProductByBarcode: (b: string) => getCachedProductByBarcodeMock(b),
  getAllPendingCount: () => getAllPendingCountMock(),
}));

vi.mock('@/lib/pos-sync', () => ({
  syncPendingSales: () => syncPendingSalesMock(),
  refreshProductCache: () => refreshProductCacheMock(),
  startOnlineWatcher: (on: () => void, off: () => void) =>
    startOnlineWatcherMock(on, off),
  onSyncStatusChange: (cb: (s: string, c: number) => void) =>
    onSyncStatusChangeMock(cb),
}));

vi.mock('@/lib/utils', () => ({
  nanoid: () => nanoidMock(),
  cn: (...args: unknown[]) => args.join(' '),
}));

import { usePosOffline } from './use-pos-offline';

describe('usePosOffline', () => {
  beforeEach(() => {
    savePendingSaleMock.mockReset();
    decreaseLocalStockMock.mockReset();
    getCachedProductsMock.mockReset();
    getCachedProductByBarcodeMock.mockReset();
    getAllPendingCountMock.mockReset();
    syncPendingSalesMock.mockReset();
    refreshProductCacheMock.mockReset();
    startOnlineWatcherMock.mockReset();
    onSyncStatusChangeMock.mockReset();
    nanoidMock.mockReset();

    getAllPendingCountMock.mockResolvedValue(0);
    refreshProductCacheMock.mockResolvedValue(undefined);
    onSyncStatusChangeMock.mockReturnValue(() => undefined);
    startOnlineWatcherMock.mockReturnValue(() => undefined);
  });

  it('exposes initial state with idle sync status', () => {
    const { result } = renderHook(() => usePosOffline());
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.pendingCount).toBe(0);
    expect(result.current.lastSyncAt).toBeNull();
  });

  it('reflects navigator.onLine when initialised', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    const { result } = renderHook(() => usePosOffline());
    expect(result.current.isOnline).toBe(true);
  });

  it('exposes saveOfflineSale, triggerSync, and getOfflineProducts as functions', () => {
    const { result } = renderHook(() => usePosOffline());
    expect(typeof result.current.saveOfflineSale).toBe('function');
    expect(typeof result.current.triggerSync).toBe('function');
    expect(typeof result.current.getOfflineProducts).toBe('function');
    expect(typeof result.current.getOfflineProductByBarcode).toBe('function');
  });

  it('saveOfflineSale persists sale and decreases stock per line', async () => {
    nanoidMock.mockReturnValue('local-1');
    getAllPendingCountMock.mockResolvedValue(1);
    savePendingSaleMock.mockResolvedValue(undefined);
    decreaseLocalStockMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePosOffline());
    const sale = {
      items: [
        { productId: 1, quantity: 2 },
        { productId: 7, quantity: 3 },
      ],
      paymentMethod: 'cash',
      total: 100,
      cartSnapshot: [],
    };
    let id = '';
    await act(async () => {
      id = await result.current.saveOfflineSale(sale);
    });
    expect(id).toBe('local-1');
    expect(savePendingSaleMock).toHaveBeenCalledTimes(1);
    expect(decreaseLocalStockMock).toHaveBeenCalledTimes(2);
  });

  it('triggerSync returns zero counts when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    const { result } = renderHook(() => usePosOffline());
    let r: Awaited<ReturnType<typeof result.current.triggerSync>>;
    await act(async () => {
      r = await result.current.triggerSync();
    });
    expect(r!).toEqual({ synced: 0, failed: 0, conflicts: 0 });
    expect(syncPendingSalesMock).not.toHaveBeenCalled();
  });

  it('getOfflineProducts forwards search argument to cached source', async () => {
    getCachedProductsMock.mockResolvedValue([{ id: 1 }]);
    const { result } = renderHook(() => usePosOffline());
    await waitFor(() => expect(result.current.pendingCount).toBe(0));
    await act(async () => {
      await result.current.getOfflineProducts('milk');
    });
    expect(getCachedProductsMock).toHaveBeenCalledWith('milk');
  });
});
