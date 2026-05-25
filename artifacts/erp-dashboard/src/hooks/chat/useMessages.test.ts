/**
 * @module useMessages.test
 * @description Vitest tests for the chat messages hook.
 */

import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>(
    '@/lib/queryClient',
  );
  return { ...actual, apiRequest: vi.fn(), getAuthHeaders: () => ({}) };
});

import { apiRequest } from '@/lib/queryClient';
import { useMessages } from './useMessages';

const mockedApi = vi.mocked(apiRequest);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('useMessages', () => {
  beforeEach(() => mockedApi.mockReset());

  it('returns idle status when roomId is null', () => {
    const { result } = renderHook(() => useMessages(null), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches messages with default limit of 50', async () => {
    mockedApi.mockResolvedValueOnce([{ id: 'm-1' }]);
    const { result } = renderHook(() => useMessages('r-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi).toHaveBeenCalledWith(
      'GET',
      '/api/chat/rooms/r-1/messages?limit=50',
    );
  });

  it('passes custom limit in the URL', async () => {
    mockedApi.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useMessages('r-2', 10), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi).toHaveBeenCalledWith(
      'GET',
      '/api/chat/rooms/r-2/messages?limit=10',
    );
  });

  it('unwraps envelope shape { data: [...] }', async () => {
    // apiRequest now returns already-unwrapped data, but the hook also tolerates
    // an unwrapped envelope shape — covers backends that hand back `{ data: [...] }`.
    mockedApi.mockResolvedValueOnce({ data: [{ id: 'm-9' }] });
    const { result } = renderHook(() => useMessages('r-3'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'm-9' }]);
  });

  it('surfaces error when apiRequest rejects', async () => {
    mockedApi.mockRejectedValueOnce(new Error('Xabarlar yuklanmadi'));
    const { result } = renderHook(() => useMessages('r-4'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Xabarlar yuklanmadi');
  });
});
