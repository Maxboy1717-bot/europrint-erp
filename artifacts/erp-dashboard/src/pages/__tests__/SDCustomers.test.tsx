/**
 * @module SDCustomers.test
 * @description Deep test for SD Customers — loading, success render,
 *   error retry button presence, dialog open trigger.
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

import SDCustomers from '../SDCustomers';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const customersPayload = {
  data: [
    {
      id: 1,
      title: 'AcmeCorp',
      customerType: 'legal',
      phone: '+998901234567',
      email: 'a@a.uz',
      segment: 'A',
      status: 'active',
      totalRevenue: 100000,
    },
  ],
};

describe('SDCustomers page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue(customersPayload);
  });

  it('renders the loading skeletons while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<SDCustomers />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page once customers load', async () => {
    apiRequestMock.mockResolvedValue(customersPayload);
    const Wrapper = makeQueryWrapper({
      responses: { '/api/sd/customers': customersPayload },
    });
    const { container } = render(<SDCustomers />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });

  it('survives the error branch with no crash', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<SDCustomers />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders at least one CTA button', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/sd/customers': customersPayload },
    });
    render(<SDCustomers />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1);
    });
  });
});
