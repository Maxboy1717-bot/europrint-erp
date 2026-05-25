/**
 * @module usePositionPermissions.test
 * @description Vitest tests for the usePositionPermissions hook.
 */

import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { apiRequestMock, useAuthMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>(
    '@/lib/queryClient',
  );
  return { ...actual, apiRequest: apiRequestMock };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

import { usePositionPermissions } from './usePositionPermissions';

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

describe('usePositionPermissions', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    useAuthMock.mockReset();
  });

  it('returns null permissions when user is not authenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false });
    const { result } = renderHook(() => usePositionPermissions(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.permissions).toBeNull();
    expect(result.current.hasPosition).toBe(false);
  });

  it('resolves as not loading when authentication is off', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false });
    const { result } = renderHook(() => usePositionPermissions(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isResolved).toBe(true);
  });

  it('exposes permissions when API succeeds', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true });
    apiRequestMock.mockResolvedValueOnce({
      userId: 1,
      username: 'u',
      role: 'finance_manager',
      positionId: 7,
      positionCode: 'FIN-MGR',
      positionNameUz: 'Moliya menejeri',
      positionNameRu: null,
      departmentCode: 'FI',
      departmentNameUz: null,
      rbacTier: 'mid',
      modules: [{ module: 'FI', level: 'FULL' }],
      featureFlags: ['finance.export'],
      isAdmin: false,
    });
    const { result } = renderHook(() => usePositionPermissions(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.permissions).not.toBeNull());
    expect(result.current.hasPosition).toBe(true);
    expect(result.current.permissions?.modules[0].module).toBe('FI');
  });

  it('treats missing positionId as no position', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true });
    apiRequestMock.mockResolvedValueOnce({
      userId: 1,
      username: 'u',
      role: 'employee',
      positionId: null,
      positionCode: null,
      positionNameUz: null,
      positionNameRu: null,
      departmentCode: null,
      departmentNameUz: null,
      rbacTier: null,
      modules: [],
      featureFlags: [],
      isAdmin: false,
    });
    const { result } = renderHook(() => usePositionPermissions(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.permissions).not.toBeNull());
    expect(result.current.hasPosition).toBe(false);
  });

  it('surfaces error state when API fails', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true });
    apiRequestMock.mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => usePositionPermissions(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.permissions).toBeNull();
  });
});
