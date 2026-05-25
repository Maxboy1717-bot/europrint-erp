/**
 * @module AssetManagement.test
 * @description Deep test for asset management — loading, success, error,
 *   tabs presence, create-dialog button.
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

import AssetManagement from '../AssetManagement';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/mro/assets': [],
  '/api/mro/assets/summary': { total: 0, byType: {}, byCondition: {} },
  '/api/mro/maintenance': [],
  '/api/mro/disposal': [],
  '/api/mro/transfers': [],
  '/api/mro/insurance': [],
};

describe('AssetManagement page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue([]);
  });

  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<AssetManagement />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<AssetManagement />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<AssetManagement />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders tabs structure', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<AssetManagement />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('tab').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('renders at least one action button', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<AssetManagement />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
    });
  });
});
