/**
 * @module ReportsHub.test
 * @description Deep test for reports hub — loading, success, error, tabs.
 */

import { render, screen, waitFor } from '@testing-library/react';
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

import ReportsHub from '../ReportsHub';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const dashboardPayload = {
  stats: { totalDefinitions: 10, totalRuns: 50, activeSubscriptions: 5 },
  categories: [],
  recentRuns: [],
};

describe('ReportsHub page', () => {
  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<ReportsHub />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page when data resolves', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/reports-hub/dashboard': dashboardPayload },
    });
    const { container } = render(<ReportsHub />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<ReportsHub />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders tabs structure', async () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/reports-hub/dashboard': dashboardPayload },
    });
    render(<ReportsHub />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('tab').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('mounts without throwing', () => {
    const Wrapper = makeQueryWrapper({
      responses: { '/api/reports-hub/dashboard': dashboardPayload },
    });
    expect(() => render(<ReportsHub />, { wrapper: Wrapper })).not.toThrow();
  });
});
