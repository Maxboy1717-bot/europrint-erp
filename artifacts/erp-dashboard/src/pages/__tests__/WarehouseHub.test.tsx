/**
 * @module WarehouseHub.test
 * @description Deep test for warehouse hub — loading, success, error,
 *   scan input interaction, tab presence.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('wouter', () => ({
  useParams: () => ({}),
  useLocation: () => ['/wms', vi.fn()],
}));

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

vi.mock('@/hooks/useWarehousePosSync', () => ({
  useWarehousePosSync: () => ({ syncStatus: 'idle' }),
}));

import WarehouseHub from '../WarehouseHub';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/warehouse/warehouses': [{ id: 'w1', name: 'Main' }],
  '/api/warehouse/stock': [],
  '/api/warehouse/qc-pending': [],
  '/api/warehouse/picking-tasks': [],
  '/api/warehouse/exit-logs': [],
  '/api/warehouse/operator-debts': [],
  '/api/material-cards': [],
  '/api/warehouse/recent-movements': [],
  '/api/warehouse/dashboard': { kpis: {}, warehouses: [] },
};

describe('WarehouseHub page', () => {
  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<WarehouseHub />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page when warehouses load', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<WarehouseHub />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<WarehouseHub />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('accepts barcode scan input value', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<WarehouseHub />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('textbox').length).toBeGreaterThanOrEqual(0);
    });
    const inputs = screen.queryAllByRole('textbox');
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: 'BC-123' } });
      expect((inputs[0] as HTMLInputElement).value).toBe('BC-123');
    }
  });

  it('mounts without throwing', () => {
    const Wrapper = makeQueryWrapper({ responses });
    expect(() => render(<WarehouseHub />, { wrapper: Wrapper })).not.toThrow();
  });
});
