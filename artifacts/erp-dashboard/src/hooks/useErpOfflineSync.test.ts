/**
 * @module useErpOfflineSync.test
 * @description Vitest tests for the useErpOfflineSync hook (state surface).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const {
  getPendingSyncCountMock,
  syncOrderDraftsMock,
  syncQcRecheckQueueMock,
  syncPosMovementsMock,
  toastMock,
  apiRequestMock,
} = vi.hoisted(() => ({
  getPendingSyncCountMock: vi.fn(),
  syncOrderDraftsMock: vi.fn(),
  syncQcRecheckQueueMock: vi.fn(),
  syncPosMovementsMock: vi.fn(),
  toastMock: vi.fn(),
  apiRequestMock: vi.fn(),
}));

vi.mock('@/lib/erp-offline-db', () => ({
  getPendingSyncCount: () => getPendingSyncCountMock(),
  syncOrderDrafts: (req: unknown) => syncOrderDraftsMock(req),
  syncQcRecheckQueue: (req: unknown) => syncQcRecheckQueueMock(req),
  syncPosMovements: (req: unknown) => syncPosMovementsMock(req),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/lib/queryClient', () => ({
  apiRequest: apiRequestMock,
}));

import { useErpOfflineSync } from './useErpOfflineSync';

describe('useErpOfflineSync', () => {
  beforeEach(() => {
    getPendingSyncCountMock.mockReset();
    syncOrderDraftsMock.mockReset();
    syncQcRecheckQueueMock.mockReset();
    syncPosMovementsMock.mockReset();
    toastMock.mockReset();
    apiRequestMock.mockReset();
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  it('returns initial sync status with zero counts', () => {
    getPendingSyncCountMock.mockResolvedValue({
      orderDrafts: 0,
      qcRechecks: 0,
      posMovements: 0,
      conflicts: 0,
    });
    const { result } = renderHook(() => useErpOfflineSync());
    expect(result.current.status.orderDrafts).toBe(0);
    expect(result.current.status.qcRechecks).toBe(0);
    expect(result.current.status.posMovements).toBe(0);
    expect(result.current.status.syncing).toBe(false);
  });

  it('exposes isOnline reflecting navigator state', () => {
    getPendingSyncCountMock.mockResolvedValue({
      orderDrafts: 0,
      qcRechecks: 0,
      posMovements: 0,
      conflicts: 0,
    });
    const { result } = renderHook(() => useErpOfflineSync());
    expect(result.current.status.isOnline).toBe(true);
  });

  it('exposes refreshCounts and syncAll as functions', () => {
    getPendingSyncCountMock.mockResolvedValue({
      orderDrafts: 0,
      qcRechecks: 0,
      posMovements: 0,
      conflicts: 0,
    });
    const { result } = renderHook(() => useErpOfflineSync());
    expect(typeof result.current.refreshCounts).toBe('function');
    expect(typeof result.current.syncAll).toBe('function');
  });

  it('refreshCounts uses fallback when getPendingSyncCount throws', async () => {
    getPendingSyncCountMock.mockRejectedValue(new Error('db locked'));
    const { result } = renderHook(() => useErpOfflineSync());
    await act(async () => {
      await result.current.refreshCounts();
    });
    expect(result.current.status.orderDrafts).toBe(0);
    expect(result.current.status.qcRechecks).toBe(0);
  });

  it('syncAll shows toast and skips when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    getPendingSyncCountMock.mockResolvedValue({
      orderDrafts: 0,
      qcRechecks: 0,
      posMovements: 0,
      conflicts: 0,
    });
    const { result } = renderHook(() => useErpOfflineSync());
    await act(async () => {
      await result.current.syncAll();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' }),
    );
    expect(syncOrderDraftsMock).not.toHaveBeenCalled();
  });

  it('refreshCounts updates state with returned counts', async () => {
    getPendingSyncCountMock.mockResolvedValue({
      orderDrafts: 3,
      qcRechecks: 1,
      posMovements: 5,
      conflicts: 0,
    });
    const { result } = renderHook(() => useErpOfflineSync());
    await waitFor(() => expect(result.current.status.orderDrafts).toBe(3));
    expect(result.current.status.qcRechecks).toBe(1);
    expect(result.current.status.posMovements).toBe(5);
  });
});
