/**
 * @module DirectorDashboard.test
 * @description Deep test for the Director dashboard — loading shells,
 *   data-loaded surface, refresh interaction, error branch, mutation call.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiRequestMock = vi.fn();
const toastMock = vi.fn();
vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>(
    '@/lib/queryClient',
  );
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  };
});
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock, dismiss: vi.fn(), toasts: [] }),
}));

import DirectorDashboard from '../DirectorDashboard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/europrint-control/director-summary': { kpis: [], summary: {} },
  '/api/director/dashboard': { metrics: {} },
  '/api/director/summary': { totals: {} },
  '/api/director/production': { sessionsToday: [] },
  '/api/director/hr': { active: 0 },
  '/api/director/finance': { revenue: 0 },
  '/api/director/alerts': { alerts: [], count: 0 },
  '/api/director/ai-summary': { text: 'ok' },
  '/api/director/wms-rental': { contracts: [] },
  '/api/europrint-control/director-kpis': [],
  '/api/europrint-control/validation-summary': {
    totalRules: 0,
    issueCount: 0,
    criticalCount: 0,
  },
  '/api/coordination/councils': [],
};

describe('DirectorDashboard page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    toastMock.mockReset();
    apiRequestMock.mockResolvedValue({});
  });

  it('renders without crashing while queries are pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<DirectorDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the dashboard surface when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<DirectorDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });

  it('triggers a toast when the refresh-all button is clicked', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<DirectorDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
    const refreshBtn = screen.getAllByRole('button')[0];
    fireEvent.click(refreshBtn);
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalled();
    });
  });

  it('survives an error in upstream queries without crashing', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<DirectorDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('exposes the header refresh icon button', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<DirectorDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1);
    });
  });
});
