/**
 * @module pos-sync.test
 * @description Vitest tests for the pos-sync listener / watcher helpers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../pos-db', () => ({
  posDb: {},
  getPendingSales: vi.fn(async () => []),
  updateSaleStatus: vi.fn(),
  cacheProducts: vi.fn(),
  getAllPendingCount: vi.fn(async () => 0),
}));

vi.mock('../queryClient', () => ({
  apiRequest: vi.fn(),
}));

import {
  onSyncStatusChange,
  startOnlineWatcher,
  refreshProductCache,
  syncPendingSales,
  getPendingCount,
} from '../pos-sync';
import { apiRequest } from '../queryClient';
import { getAllPendingCount } from '../pos-db';

describe('onSyncStatusChange', () => {
  it('registers a listener and returns an unsubscribe function', () => {
    const cb = vi.fn();
    const unsub = onSyncStatusChange(cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('returns a different unsubscribe per subscriber', () => {
    const u1 = onSyncStatusChange(() => undefined);
    const u2 = onSyncStatusChange(() => undefined);
    expect(u1).not.toBe(u2);
    u1();
    u2();
  });

  it('allows multiple subscribers without throwing', () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = onSyncStatusChange(a);
    const unsubB = onSyncStatusChange(b);
    expect(() => {
      unsubA();
      unsubB();
    }).not.toThrow();
  });
});

describe('startOnlineWatcher', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a teardown function', () => {
    const teardown = startOnlineWatcher(() => undefined, () => undefined);
    expect(typeof teardown).toBe('function');
    teardown();
  });

  it('fires onOnline when the online event dispatches', () => {
    const onOnline = vi.fn();
    const onOffline = vi.fn();
    const teardown = startOnlineWatcher(onOnline, onOffline);
    window.dispatchEvent(new Event('online'));
    expect(onOnline).toHaveBeenCalledTimes(1);
    expect(onOffline).not.toHaveBeenCalled();
    teardown();
  });

  it('fires onOffline when the offline event dispatches', () => {
    const onOnline = vi.fn();
    const onOffline = vi.fn();
    const teardown = startOnlineWatcher(onOnline, onOffline);
    window.dispatchEvent(new Event('offline'));
    expect(onOffline).toHaveBeenCalledTimes(1);
    teardown();
  });

  it('teardown stops further events from firing the handlers', () => {
    const onOnline = vi.fn();
    const teardown = startOnlineWatcher(onOnline, () => undefined);
    teardown();
    window.dispatchEvent(new Event('online'));
    expect(onOnline).not.toHaveBeenCalled();
  });
});

describe('refreshProductCache', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it('returns 0 when API throws', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error('boom'));
    const n = await refreshProductCache();
    expect(n).toBe(0);
  });

  it('extracts product count from { products: [...] } envelope', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      products: [{ id: 1 }, { id: 2 }, { id: 3 }],
    });
    const n = await refreshProductCache();
    expect(n).toBe(3);
  });

  it('returns array length when API returns array directly', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce([{ id: 1 }]);
    const n = await refreshProductCache();
    expect(n).toBe(1);
  });
});

describe('syncPendingSales / getPendingCount', () => {
  beforeEach(() => {
    vi.mocked(getAllPendingCount).mockReset();
    vi.mocked(getAllPendingCount).mockResolvedValue(0);
  });

  it('getPendingCount delegates to getAllPendingCount', async () => {
    vi.mocked(getAllPendingCount).mockResolvedValueOnce(5);
    const n = await getPendingCount();
    expect(n).toBe(5);
  });

  it('syncPendingSales returns the sync result object', async () => {
    const result = await syncPendingSales();
    expect(result).toEqual({ synced: 0, failed: 0, conflicts: 0 });
  });
});
