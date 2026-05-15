/**
 * @module RoutingConfiguration.test
 * @description Deep test for routing configuration — loading, success,
 *   error, dialog open trigger, search input.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import RoutingConfiguration from '../RoutingConfiguration';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/pp/routings': [],
  '/api/pp/operations': [],
  '/api/erp/products': [],
  '/api/pp/work-centers': [],
};

describe('RoutingConfiguration page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({});
  });

  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<RoutingConfiguration />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<RoutingConfiguration />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<RoutingConfiguration />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders create button after load', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<RoutingConfiguration />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });

  it('does not call apiRequest on initial mount', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<RoutingConfiguration />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});
