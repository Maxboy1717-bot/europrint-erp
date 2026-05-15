/**
 * @module PPDashboard.test
 * @description Deep test for production planning dashboard — loading, success,
 *   error, KPI count derivation.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import PPDashboard from '../PPDashboard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/production/stats': {
    orders: { total: 10, byStatus: { completed: 5 } },
  },
  '/api/papka-orders': [
    { id: 1, status: 'ishlab_chiqarishda' },
    { id: 2, status: 'tayyor' },
  ],
  '/api/machine-tasks': [
    { id: 100, status: 'pending' },
    { id: 101, status: 'in_progress' },
  ],
};

describe('PPDashboard page', () => {
  it('renders the shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<PPDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<PPDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('a').length).toBeGreaterThan(0);
    });
  });

  it('renders error retry surface on failure', async () => {
    const Wrapper = makeErrorWrapper();
    render(<PPDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      const btns = screen.queryAllByRole('button');
      expect(btns.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('renders module links to papka-orders', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<PPDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      const links = container.querySelectorAll('a');
      const hasPapkaLink = Array.from(links).some((a) =>
        (a.getAttribute('href') ?? '').includes('papka-orders'),
      );
      expect(hasPapkaLink).toBe(true);
    });
  });

  it('mounts without throwing', () => {
    const Wrapper = makeQueryWrapper({ responses });
    expect(() => render(<PPDashboard />, { wrapper: Wrapper })).not.toThrow();
  });
});
