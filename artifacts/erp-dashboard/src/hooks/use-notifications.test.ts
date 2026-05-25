/**
 * @module use-notifications.test
 * @description Vitest tests for notification hooks.
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

import { apiRequest } from '@/lib/queryClient';
import {
  useMyNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllRead,
  useUpdateNotificationPreferences,
} from './use-notifications';

const mockedApi = vi.mocked(apiRequest);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchInterval: false,
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

describe('use-notifications hooks', () => {
  beforeEach(() => mockedApi.mockReset());

  it('coerces notifications envelope into array', async () => {
    mockedApi.mockResolvedValueOnce({ notifications: [{ id: 1 }] });
    const { result } = renderHook(() => useMyNotifications(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('returns number when unread count endpoint returns a number', async () => {
    mockedApi.mockResolvedValueOnce(7);
    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(7);
  });

  it('reads count field from envelope', async () => {
    mockedApi.mockResolvedValueOnce({ count: 3 });
    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(3);
  });

  it('falls back to 0 when count is missing', async () => {
    mockedApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(0);
  });

  it('patches notification when mark-read mutation runs', async () => {
    mockedApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync(42);
    });
    expect(mockedApi).toHaveBeenCalledWith(
      'PATCH',
      '/api/notifications/42/read',
      {},
    );
  });

  it('posts to mark-all-read endpoint', async () => {
    mockedApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useMarkAllRead(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync();
    });
    expect(mockedApi).toHaveBeenCalledWith(
      'POST',
      '/api/notifications/my/mark-all-read',
      {},
    );
  });

  it('updates preferences via PUT', async () => {
    mockedApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useUpdateNotificationPreferences(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ email: false });
    });
    expect(mockedApi).toHaveBeenCalledWith(
      'PUT',
      '/api/notifications/preferences',
      { email: false },
    );
  });
});
