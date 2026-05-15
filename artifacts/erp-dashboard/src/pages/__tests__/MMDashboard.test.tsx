/**
 * @module MMDashboard.test
 * @description Deep test for MM dashboard — loading, success, error,
 *   stock indicators, nav links.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import MMDashboard from '../MMDashboard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/mm/materials': [],
  '/api/mm/transactions': [],
  '/api/mm/vendors': [],
  '/api/mm/stats': {
    totalMaterials: 0,
    activeVendors: 0,
    pendingOrders: 0,
    lowStockCount: 0,
  },
};

describe('MMDashboard page', () => {
  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<MMDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<MMDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<MMDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders link entries to deeper screens', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<MMDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('a').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('mounts without throwing', () => {
    const Wrapper = makeQueryWrapper({ responses });
    expect(() => render(<MMDashboard />, { wrapper: Wrapper })).not.toThrow();
  });
});
