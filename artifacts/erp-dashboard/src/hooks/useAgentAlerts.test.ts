/**
 * @module useAgentAlerts.test
 * @description Vitest tests for the useAgentAlerts hook.
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
import { useAgentAlerts, type AgentAlert } from './useAgentAlerts';

const mockedApi = vi.mocked(apiRequest);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { gcTime: 0,  retry: false, refetchInterval: false },
      mutations: { retry: false },
    },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

function makeAlert(over: Partial<AgentAlert> = {}): AgentAlert {
  return {
    id: 'a-1',
    agentName: 'cfo',
    severity: 'info',
    title: 'cash',
    message: 'low',
    module: 'FI',
    relatedId: null,
    actionRequired: false,
    actions: [],
    isRead: false,
    createdAt: new Date(0).toISOString(),
    ...over,
  };
}

describe('useAgentAlerts', () => {
  beforeEach(() => mockedApi.mockReset());

  it('returns an empty list while the request is pending', async () => {
    mockedApi.mockImplementation(() => new Promise(r => { setTimeout(() => r([]), 100); }));
    const { result, unmount } = renderHook(() => useAgentAlerts(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.alerts).toEqual([]);
    expect(result.current.unread).toBe(0);
    expect(result.current.isLoading).toBe(true);
    unmount();
  });

  it('exposes alerts when API succeeds', async () => {
    mockedApi.mockResolvedValueOnce([makeAlert({ id: '1' }), makeAlert({ id: '2', isRead: true })]);
    const { result } = renderHook(() => useAgentAlerts(5), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.alerts).toHaveLength(2);
  });

  it('computes unread count correctly', async () => {
    mockedApi.mockResolvedValueOnce([
      makeAlert({ id: '1', isRead: false }),
      makeAlert({ id: '2', isRead: false }),
      makeAlert({ id: '3', isRead: true }),
    ]);
    const { result } = renderHook(() => useAgentAlerts(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.alerts.length).toBe(3));
    expect(result.current.unread).toBe(2);
  });

  it('falls back to empty list when API throws', async () => {
    mockedApi.mockRejectedValueOnce(new Error('502'));
    const { result } = renderHook(() => useAgentAlerts(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.alerts).toEqual([]);
  });

  it('calls /read endpoint when markRead is invoked', async () => {
    mockedApi.mockResolvedValueOnce([makeAlert({ id: 'x1' })]);
    mockedApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useAgentAlerts(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.alerts.length).toBe(1));
    act(() => {
      result.current.markRead('x1');
    });
    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith('POST', '/api/agents/alerts/x1/read'),
    );
  });
});
