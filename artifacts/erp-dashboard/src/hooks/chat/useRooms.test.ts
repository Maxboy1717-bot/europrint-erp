/**
 * @module useRooms.test
 * @description Vitest tests for the chat room query hooks.
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

import { apiRequest } from '@/lib/queryClient';
import { useRooms, useRoomMembers, useEmployeeSearch } from './useRooms';

const mockedApi = vi.mocked(apiRequest);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('useRooms', () => {
  beforeEach(() => mockedApi.mockReset());

  it('returns rooms array when API responds with an array', async () => {
    mockedApi.mockResolvedValueOnce([{ id: 'r-1' }, { id: 'r-2' }]);
    const { result } = renderHook(() => useRooms(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('extracts rooms from envelope shape', async () => {
    mockedApi.mockResolvedValueOnce({ rooms: [{ id: 'r-9' }] });
    const { result } = renderHook(() => useRooms(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'r-9' }]);
  });

  it('returns empty array when payload is malformed', async () => {
    mockedApi.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useRooms(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('disables members query when roomId is null', () => {
    const { result } = renderHook(() => useRoomMembers(null), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it('queries members with room id when provided', async () => {
    mockedApi.mockResolvedValueOnce([{ userId: 1 }]);
    const { result } = renderHook(() => useRoomMembers('room-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi).toHaveBeenCalledWith(
      'GET',
      '/api/chat/rooms/room-1/members',
    );
  });

  it('passes search query to employee search endpoint', async () => {
    mockedApi.mockResolvedValueOnce([{ id: 1 }]);
    const { result } = renderHook(() => useEmployeeSearch('alice'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi).toHaveBeenCalledWith(
      'GET',
      '/api/chat/employees?search=alice',
    );
  });

  it('omits search param when query is empty', async () => {
    mockedApi.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useEmployeeSearch(''), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi).toHaveBeenCalledWith('GET', '/api/chat/employees');
  });
});
