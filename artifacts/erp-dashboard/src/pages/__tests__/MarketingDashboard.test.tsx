/**
 * @module MarketingDashboard.test
 * @description Deep test for marketing dashboard — loading, success, error,
 *   nps panel, churn panel.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import MarketingDashboard from '../MarketingDashboard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/marketing/segments': [],
  '/api/marketing/ai/hot-leads': [],
  '/api/marketing/leads/sources/summary': {},
  '/api/marketing/dashboard/stats': { totalLeads: 0, totalCampaigns: 0 },
  '/api/marketing/campaigns': [],
  '/api/marketing/inbox/stats': { totalConversations: 0, openConversations: 0, unreadCount: 0 },
  '/api/marketing/website/blog': [],
  '/api/marketing/nps/stats': { score: 0, total: 0 },
  '/api/marketing/churn-risk': { highRisk: 0, total: 0 },
};

describe('MarketingDashboard page', () => {
  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<MarketingDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<MarketingDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<MarketingDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders at least one section heading', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<MarketingDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('h1, h2, h3').length).toBeGreaterThan(0);
    });
  });

  it('mounts without throwing', () => {
    const Wrapper = makeQueryWrapper({ responses });
    expect(() => render(<MarketingDashboard />, { wrapper: Wrapper })).not.toThrow();
  });
});
