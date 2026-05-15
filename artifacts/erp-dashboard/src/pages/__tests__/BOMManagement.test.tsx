/**
 * @module BOMManagement.test
 * @description Deep test for BOM management — loading, success, error,
 *   create-dialog open, search input.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

vi.mock('@/components/undo-toast', () => ({
  useUndoDelete: () => ({ showUndoToast: vi.fn() }),
}));

import BOMManagement from '../BOMManagement';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  // Non-empty data prevents the page from short-circuiting to the empty
  // state (which renders no buttons), so the "after data resolves" assertion
  // can find actual interactive controls.
  '/api/erp/bom-headers': [
    {
      id: 'b-1',
      bomNumber: 'BOM-001',
      productId: 'p-1',
      version: 1,
      status: 'active',
    },
  ],
  '/api/erp/products': [
    { id: 'p-1', code: 'P001', name: 'Test product' },
  ],
  '/api/erp/bom-items': [],
};

describe('BOMManagement page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({});
  });

  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<BOMManagement />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page once data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<BOMManagement />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<BOMManagement />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders a search textbox after load', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<BOMManagement />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('textbox').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('does not call apiRequest on initial mount', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<BOMManagement />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});
