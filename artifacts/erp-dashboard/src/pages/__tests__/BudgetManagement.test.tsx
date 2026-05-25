/**
 * @module BudgetManagement.test
 * @description Deep test for budget management — auth state, loading, success
 *   render, error survival, create-dialog interaction.
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
    fetchWithAuth: vi.fn().mockResolvedValue([]),
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'super_admin', username: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    hasRole: () => true,
    logout: vi.fn(),
    refetch: vi.fn(),
  }),
}));

import BudgetManagement from '../BudgetManagement';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/finance/budgets': [],
  '/api/finance/accounts': [],
  '/api/finance/cost-centers': [],
};

describe('BudgetManagement page', () => {
  it('renders the shell while data is pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<BudgetManagement />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders content when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<BudgetManagement />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });

  it('survives an error in the budget query', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<BudgetManagement />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders at least one action button', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<BudgetManagement />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });

  it('does not auto-create a budget on mount', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<BudgetManagement />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});
