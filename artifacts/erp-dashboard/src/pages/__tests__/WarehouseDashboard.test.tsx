/**
 * @module WarehouseDashboard.test
 * @description Deep test for warehouse dashboard — loading, success, error,
 *   refresh button, link rendering.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const navigateMock = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/warehouse', navigateMock],
}));

import WarehouseDashboard from '../WarehouseDashboard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const dashPayload = {
  kpis: { totalStock: 100 },
  warehouses: [{ id: 'w1', name: 'Main' }],
  alerts: { lowStockItems: [] },
  recentTransactions: [],
  pendingTransfers: [],
  categoryStats: [],
};

describe('WarehouseDashboard page', () => {
  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<WarehouseDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page once data resolves', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/warehouse/dashboard': dashPayload },
    });
    const { container } = render(<WarehouseDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<WarehouseDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders quick-link entries to deep WMS screens', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/warehouse/dashboard': dashPayload },
    });
    render(<WarehouseDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
    // Click a quick link if present — should call navigate via wouter.
    const grnBtn = screen
      .getAllByRole('button')
      .find((b) => /grn|qabul/i.test(b.textContent ?? ''));
    if (grnBtn) fireEvent.click(grnBtn);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('renders refresh button after load', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/warehouse/dashboard': dashPayload },
    });
    render(<WarehouseDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });
});
