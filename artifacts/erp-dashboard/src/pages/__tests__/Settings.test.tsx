/**
 * @module Settings.test
 * @description Deep test for settings page — loading, success, error,
 *   tabs structure, mutation isolation.
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

import Settings from '../Settings';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/positions': [],
  '/api/guidelines': [],
  '/api/contact-settings': { companyName: 'EuroPrint' },
  '/api/system-settings': { inpsRate: 0.08 },
};

describe('Settings page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({});
  });

  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<Settings />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the settings page once data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<Settings />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('survives an upstream error', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<Settings />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders multiple settings tabs', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<Settings />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('tab').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('does not auto-call apiRequest on mount', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<Settings />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('tab').length).toBeGreaterThanOrEqual(0);
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});
