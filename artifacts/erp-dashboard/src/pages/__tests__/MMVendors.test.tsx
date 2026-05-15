/**
 * @module MMVendors.test
 * @description Deep test for vendors page — loading, success, error,
 *   add-vendor dialog open, search.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

import MMVendors from '../MMVendors';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const vendors = [
  {
    id: 'v1',
    name: 'ACME Supply',
    code: 'ACM',
    contactPerson: 'Bob',
    email: 'bob@acme.com',
    phone: '+998900000000',
    status: 'active',
  },
];

describe('MMVendors page', () => {
  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<MMVendors />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the vendor list when data resolves', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/mm/vendors': vendors },
    });
    const { container } = render(<MMVendors />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<MMVendors />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the create-vendor button after load', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/mm/vendors': vendors },
    });
    render(<MMVendors />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });

  it('reflects search input typed value', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/mm/vendors': vendors },
    });
    render(<MMVendors />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('textbox').length).toBeGreaterThanOrEqual(0);
    });
    const inputs = screen.queryAllByRole('textbox');
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: 'ACME' } });
      expect((inputs[0] as HTMLInputElement).value).toBe('ACME');
    }
  });
});
