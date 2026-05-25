/**
 * @module use-role-menus.test
 * @description Vitest tests for the useRoleMenus hook.
 */

import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>(
    '@/lib/queryClient',
  );
  return { ...actual, apiRequest: apiRequestMock };
});

import { useRoleMenus } from './use-role-menus';

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        queryFn: async ({ queryKey }) => {
          const [url] = queryKey as [string];
          return apiRequestMock('GET', url);
        },
      },
    },
  });
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
}

describe('useRoleMenus', () => {
  beforeEach(() => apiRequestMock.mockReset());

  it('grants admin access to every menu', async () => {
    apiRequestMock.mockResolvedValueOnce({ id: '1', role: 'admin' });
    apiRequestMock.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useRoleMenus(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.role).toBe('admin'));
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isMenuAllowed('hr/employees')).toBe(true);
    expect(result.current.isMenuAllowed('director/analytics')).toBe(true);
  });

  it('allows /chat for any role', async () => {
    apiRequestMock.mockResolvedValueOnce({ id: '2', role: 'employee' });
    apiRequestMock.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useRoleMenus(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.role).toBe('employee'));
    expect(result.current.isMenuAllowed('chat')).toBe(true);
    expect(result.current.isMenuAllowed('/chat')).toBe(true);
  });

  it('returns false for unknown role (fail-closed)', async () => {
    apiRequestMock.mockResolvedValueOnce({ id: '3', role: 'unknown_role' });
    apiRequestMock.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useRoleMenus(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.role).toBe('unknown_role'));
    expect(result.current.isMenuAllowed('hr/employees')).toBe(false);
  });

  it('matches role-specific prefixes from the built-in map', async () => {
    apiRequestMock.mockResolvedValueOnce({ id: '4', role: 'finance' });
    apiRequestMock.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useRoleMenus(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.role).toBe('finance'));
    expect(result.current.isMenuAllowed('fi/accounts')).toBe(true);
    expect(result.current.isMenuAllowed('finance/dashboard')).toBe(true);
    expect(result.current.isMenuAllowed('hr/employees')).toBe(false);
  });

  it('uses DB-configured menus when provided', async () => {
    // The hook fires `/api/auth/me` once, then `/api/europrint-control/menus`
    // potentially twice (initial role='viewer' default, then again once the
    // user resolves to 'finance'). Use a route-aware mock so every menus call
    // returns the seeded menu list regardless of how many times it fires.
    apiRequestMock.mockImplementation(async (_method: string, url: string) => {
      if (url === '/api/auth/me') return { id: '5', role: 'finance' };
      if (url === '/api/europrint-control/menus') {
        return [{ id: 'm1', menuPath: 'reports', role: 'finance' }];
      }
      return undefined;
    });
    const { result } = renderHook(() => useRoleMenus(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() =>
      expect(result.current.allowedMenus?.length ?? 0).toBeGreaterThan(0),
    );
    await waitFor(() =>
      expect(result.current.isMenuAllowed('reports/balance')).toBe(true),
    );
  });

  it('defaults role to viewer when user has none', async () => {
    apiRequestMock.mockResolvedValueOnce({ id: '6', role: '' });
    apiRequestMock.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useRoleMenus(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.role).toBe('viewer'));
    expect(result.current.isAdmin).toBe(false);
  });
});
