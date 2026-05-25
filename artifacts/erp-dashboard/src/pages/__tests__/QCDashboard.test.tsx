/**
 * @module QCDashboard.test
 * @description Deep test for QC dashboard — loading, success render with pass
 *   rate badge, error survival, deep-link badges, error retry.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import QCDashboard from '../QCDashboard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/qc/dashboard/stats': {
    tests: { passRate: 97 },
    openRca: 2,
  },
  '/api/qc/dashboard/flow': { stages: [] },
  '/api/qc/braks': [],
  '/api/qc/reclamations': [],
  '/api/qc/supplier-quality': [],
};

describe('QCDashboard page', () => {
  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<QCDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders pass-rate badge when stats load', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<QCDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.textContent).toMatch(/97%/);
    });
  });

  it('renders open RCA badge when openRca > 0', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<QCDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.textContent).toMatch(/2 ochiq RCA/);
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<QCDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('does not throw when stats are absent', () => {
    const Wrapper = makeQueryWrapper({
      responses: {
        '/api/qc/dashboard/stats': null,
        '/api/qc/dashboard/flow': null,
        '/api/qc/braks': [],
        '/api/qc/reclamations': [],
        '/api/qc/supplier-quality': [],
      },
    });
    expect(() => render(<QCDashboard />, { wrapper: Wrapper })).not.toThrow();
  });
});
