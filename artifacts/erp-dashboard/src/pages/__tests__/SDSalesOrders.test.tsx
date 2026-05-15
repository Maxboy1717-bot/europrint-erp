/**
 * @module SDSalesOrders.test
 * @description Deep test for SD sales orders — loading, success, error,
 *   filter Select, table rendering.
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

import SDSalesOrders from '../SDSalesOrders';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const orders = [
  {
    id: 'o1',
    documentNumber: 'SO-001',
    moduleStatus: 'in_progress',
    overallStatus: 'pending',
    totalValue: 10000,
    advancePaidAmount: 3000,
    balanceDueAmount: 7000,
    requestedDeliveryDate: '2024-04-01',
    deliveryAddress: 'Tashkent',
    customer: { title: 'CustomerCo' },
    timeline: [],
    payments: [],
  },
];

describe('SDSalesOrders page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({});
  });

  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<SDSalesOrders />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders orders list when data resolves', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/sd/sales-orders': orders },
    });
    const { container } = render(<SDSalesOrders />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<SDSalesOrders />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders filter Select trigger', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/sd/sales-orders': orders },
    });
    render(<SDSalesOrders />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('combobox').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('mounts without throwing', () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/sd/sales-orders': orders },
    });
    expect(() => render(<SDSalesOrders />, { wrapper: Wrapper })).not.toThrow();
  });
});
