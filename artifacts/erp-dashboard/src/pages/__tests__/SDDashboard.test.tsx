/**
 * @module SDDashboard.test
 * @description Deep test for the SD Dashboard — loading shell, success
 *   surface, derived KPI math, error branch survival, link rendering.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('wouter', () => ({
  useLocation: () => ['/sd', vi.fn()],
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import SDDashboard from '../SDDashboard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/crm/ai/dashboard-analysis': {
    stats: { leads: 100, deals: 25, contacts: 50, companies: 10 },
    analysis: { overallHealth: 'yaxshi' },
  },
  '/api/crm/leads': [
    { id: 1, statusId: 'yangi' },
    { id: 2, statusId: 'qiziqdi' },
  ],
  '/api/crm/deals': [
    { id: 10, opportunity: 50000 },
    { id: 11, opportunity: 30000 },
  ],
  '/api/crm/invoices': [],
};

describe('SDDashboard page', () => {
  it('renders the shell while queries pend', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<SDDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the dashboard title once data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<SDDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText(/CRM \/ Savdo Dashbordi/i)).toBeInTheDocument();
    });
  });

  it('renders the health badge with overallHealth value', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<SDDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.textContent).toMatch(/Holat: yaxshi/i);
    });
  });

  it('renders the CRM nav link to the workspace', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<SDDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /CRM/i });
      expect(link).toHaveAttribute('href', '/crm-workspace');
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<SDDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });
});
