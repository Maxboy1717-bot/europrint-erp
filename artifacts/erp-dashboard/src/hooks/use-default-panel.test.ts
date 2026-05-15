/**
 * @module use-default-panel.test
 * @description Vitest tests for the useDefaultPanel hook.
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
import { useDefaultPanel } from './use-default-panel';

const mockedApi = vi.mocked(apiRequest);

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        queryFn: async ({ queryKey }) => {
          const [url] = queryKey as [string];
          return mockedApi('GET', url);
        },
      },
    },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('useDefaultPanel', () => {
  beforeEach(() => mockedApi.mockReset());

  it('returns defaults when no panel is configured', async () => {
    mockedApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDefaultPanel(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.defaultPage).toBe('analytics');
    expect(result.current.pinnedModules).toEqual([]);
  });

  it('exposes panel data when API returns a config', async () => {
    mockedApi.mockResolvedValueOnce({
      id: 'p1',
      defaultPage: 'production',
      pinnedModules: ['hr', 'finance'],
    });
    const { result } = renderHook(() => useDefaultPanel(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.defaultPage).toBe('production');
    expect(result.current.pinnedModules).toEqual(['hr', 'finance']);
    expect(result.current.panel?.id).toBe('p1');
  });

  it('reports loading state while fetch is pending', async () => {
    mockedApi.mockImplementation(() => new Promise(r => { setTimeout(() => r({}), 100); }));
    const { result, unmount } = renderHook(() => useDefaultPanel(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.panel).toBeUndefined();
    unmount();
  });

  it('uses fallback values when fetch fails', async () => {
    mockedApi.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useDefaultPanel(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.defaultPage).toBe('analytics');
    expect(result.current.pinnedModules).toEqual([]);
  });

  it('coerces missing pinnedModules to empty array', async () => {
    mockedApi.mockResolvedValueOnce({ defaultPage: 'hr' });
    const { result } = renderHook(() => useDefaultPanel(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(Array.isArray(result.current.pinnedModules)).toBe(true);
    expect(result.current.pinnedModules).toEqual([]);
  });
});
