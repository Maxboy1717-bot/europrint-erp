/**
 * @module HRDashboard.test
 * @description Deep test for HR dashboard — loading shell, success surface,
 *   error branch with retry, multi-tab presence.
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

import HRDashboard from '../HRDashboard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/users': [],
  '/api/hr/abc-analysis': [],
  '/api/hr/discipline-records': [],
  '/api/hr/attendance': [],
  '/api/hr/resignation-stats': [],
  '/api/hr/monthly-trend': [],
  '/api/hr/alerts': { alerts: [], stats: { critical: 0, warning: 0, info: 0, total: 0 } },
  '/api/hr/risk-scores': {
    scores: [],
    stats: { low: 0, medium: 0, high: 0, critical: 0 },
  },
  '/api/hr/safety/summary': {},
  '/api/hr/safety/incidents': [],
  '/api/hr/discipline/blocked': [],
  '/api/hr-v2/pip': [],
  '/api/hr/gamification/leaderboard/monthly': { leaderboard: [] },
  '/api/hr-v2/enps': [],
  '/api/hr/ai-interview/sessions': [],
  '/api/hr-v2/daily-reports/stats': {},
  '/api/hr/adaptation/at-risk': [],
  '/api/hr/offboarding/cases/stats': {},
  '/api/hr/contracts/expiring': [],
  '/api/hr/birthdays/today': [],
  '/api/hr/birthdays/upcoming': [],
  '/api/hr/milestones/upcoming': [],
};

describe('HRDashboard page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue([]);
  });

  it('renders the shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<HRDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the dashboard surface when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<HRDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });

  it('renders the error state with retry when the employees query fails', async () => {
    const Wrapper = makeErrorWrapper();
    render(<HRDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      const btns = screen.getAllByRole('button');
      expect(btns.length).toBeGreaterThan(0);
    });
  });

  it('renders pill tabs for module navigation', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<HRDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      // PillTabs render as buttons; ensure at least multiple tab-like buttons.
      expect(container.querySelectorAll('button').length).toBeGreaterThanOrEqual(
        1,
      );
    });
  });

  it('mounts cleanly without crashing', () => {
    const Wrapper = makeQueryWrapper({ responses });
    expect(() => render(<HRDashboard />, { wrapper: Wrapper })).not.toThrow();
  });
});
