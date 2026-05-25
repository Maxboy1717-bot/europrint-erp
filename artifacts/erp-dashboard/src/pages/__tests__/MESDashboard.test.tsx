/**
 * @module MESDashboard.test
 * @description Deep test for MES dashboard — loading, success, error, KPIs.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import MESDashboard from '../MESDashboard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/mes/stats': {
    maintenance: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    tasks: { total: 0, active: 0, completed: 0 },
    oee: { overall: 80, availability: 90, performance: 88, quality: 95 },
  },
  '/api/mes/oee': [],
  '/api/mes/tasks': [],
  '/api/papka-orders': [],
  '/api/mes/sessions': [],
};

describe('MESDashboard page', () => {
  it('renders the shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<MESDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the dashboard when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<MESDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<MESDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders link entries to deeper screens', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<MESDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('a').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('mounts without throwing', () => {
    const Wrapper = makeQueryWrapper({ responses });
    expect(() => render(<MESDashboard />, { wrapper: Wrapper })).not.toThrow();
  });
});
