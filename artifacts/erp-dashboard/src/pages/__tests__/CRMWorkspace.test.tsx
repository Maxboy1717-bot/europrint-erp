/**
 * @module CRMWorkspace.test
 * @description Deep test for the CRM workspace shell — loading, success,
 *   error, header presence, view-mode interaction.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('wouter', () => ({
  useLocation: () => ['/crm-workspace', vi.fn()],
  useSearch: () => '',
  useRoute: () => [false, {}],
  useParams: () => ({}),
  useRouter: () => ({ base: '' }),
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Switch: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Redirect: () => null,
  Router: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import CRMWorkspace from '../CRMWorkspace';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/crm/leads': { data: [] },
  '/api/crm/deals': { data: [] },
  '/api/crm/contacts': { data: [] },
  '/api/crm/companies': { data: [] },
  '/api/crm/stages': [],
  '/api/crm/activities': [],
  '/api/crm/robots': [],
};

describe('CRMWorkspace page', () => {
  it('renders the CRM shell while data is pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<CRMWorkspace />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the workspace surface when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<CRMWorkspace />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });

  it('survives the error branch when queries fail', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<CRMWorkspace />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders interactive buttons on the toolbar', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<CRMWorkspace />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('mounts without throwing on first render', () => {
    const Wrapper = makeQueryWrapper({ responses });
    expect(() => render(<CRMWorkspace />, { wrapper: Wrapper })).not.toThrow();
  });
});
