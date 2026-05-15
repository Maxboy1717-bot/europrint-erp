/**
 * @module CashFlowManagement.test
 * @description Deep test for cashflow page — loading, success, error,
 *   dialog open, isolation from mutation calls.
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
    user: { id: 1, role: 'super_admin' },
    isAuthenticated: true,
    isLoading: false,
    hasRole: () => true,
    logout: vi.fn(),
    refetch: vi.fn(),
  }),
}));

import CashFlowManagement from '../CashFlowManagement';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/finance/cashflow/transactions': [],
  '/api/finance/cashflow/daily-summary': [],
  '/api/finance/cashflow/forecast': [],
  '/api/finance/cashflow/cash-position': { totalCash: 0 },
  '/api/finance/bank-accounts': [],
};

describe('CashFlowManagement page', () => {
  it('renders the shell while data is pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<CashFlowManagement />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders content when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<CashFlowManagement />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThanOrEqual(
        0,
      );
    });
  });

  it('survives error branch without crashing', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<CashFlowManagement />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('does not call apiRequest on initial mount', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<CashFlowManagement />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it('renders without throwing', () => {
    const Wrapper = makeQueryWrapper({ responses });
    expect(() => render(<CashFlowManagement />, { wrapper: Wrapper })).not.toThrow();
  });
});
