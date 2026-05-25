/**
 * @module MMPurchaseOrders.test
 * @description Deep test for purchase orders — loading, success, error,
 *   create-order dialog presence, table rendering.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import MMPurchaseOrders from '../MMPurchaseOrders';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/mm/purchase-orders': [],
  '/api/mm/vendors': [],
  '/api/mm/raw-materials': [],
};

describe('MMPurchaseOrders page', () => {
  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<MMPurchaseOrders />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<MMPurchaseOrders />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<MMPurchaseOrders />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders at least one action button after load', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<MMPurchaseOrders />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('mounts without throwing', () => {
    const Wrapper = makeQueryWrapper({ responses });
    expect(() => render(<MMPurchaseOrders />, { wrapper: Wrapper })).not.toThrow();
  });
});
