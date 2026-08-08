/**
 * @module ERPOrdersTab.smoke.test
 * @description Smoke test: render does not throw. Also covers the EP-PP-082
 *   9-status lifecycle (PoStatus) Badge/label widening — see production-order
 *   .aggregate.ts for the canonical enum this mirrors.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider, type QueryFunction } from '@tanstack/react-query';
import { LanguageProvider } from '@/lib/i18n';
import { TestProviders } from '@/test/TestProviders';
import { ERPOrdersTab as Page } from './ERPOrdersTab';

describe('ERPOrdersTab smoke', () => {
  it('renders without throwing', () => {
    const { container } = render(<Page />, { wrapper: TestProviders });
    expect(container.firstChild).not.toBeNull();
  });
});

/** Build a QueryClientProvider + LanguageProvider wrapper seeded with `/api/erp/orders`. */
function renderWithOrders(orders: Record<string, unknown>[]) {
  const queryFn: QueryFunction = async ({ queryKey }) => {
    const key = String(queryKey[0] ?? '');
    if (key === '/api/erp/orders') return orders;
    if (key === '/api/erp/products') return [];
    return null;
  };
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, queryFn }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LanguageProvider initialLanguage="uz">
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </LanguageProvider>
    );
  }
  return render(<Page />, { wrapper: Wrapper });
}

// EP-PP-082: the 9 canonical PoStatus members (production-order.aggregate.ts)
// mapped to their expected `uz` label (locales/uz/production.json).
const PO_STATUS_LABELS: Record<string, string> = {
  planned: 'Reja',
  confirmed: 'Tasdiqlangan',
  released_to_production: 'Ishga tushgan',
  in_progress: 'Jarayonda',
  in_qc: 'Sifatda',
  completed: 'Yakunlandi',
  closed: 'Yopildi',
  paused: "To'xtatilgan",
  cancelled: 'Bekor qilindi',
};

describe('ERPOrdersTab — EP-PP-082 status widening', () => {
  it('renders a distinct localized badge label for every one of the 9 PoStatus values', async () => {
    const orders = Object.keys(PO_STATUS_LABELS).map((status, i) => ({
      id: `po-${i}`,
      orderNumber: `PO-${1000 + i}`,
      productId: null,
      quantity: 10,
      customerName: 'Test',
      dueDate: '2026-08-01',
      priority: 'normal',
      status,
      notes: '',
    }));

    renderWithOrders(orders);

    await waitFor(() => {
      expect(screen.getByText('PO-1000')).toBeInTheDocument();
    });

    for (const label of Object.values(PO_STATUS_LABELS)) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('falls back to the raw string (no crash) for a legacy status outside the 9-status enum', async () => {
    // 'qc_hold' is a legacy value still permitted by the DB CHECK constraint
    // (production_orders_status_chk) but is NOT a PoStatus enum member.
    const orders = [
      {
        id: 'po-legacy',
        orderNumber: 'PO-LEGACY',
        productId: null,
        quantity: 5,
        customerName: 'Legacy Co',
        dueDate: '2026-08-01',
        priority: 'normal',
        status: 'qc_hold',
        notes: '',
      },
    ];

    const { container } = renderWithOrders(orders);

    await waitFor(() => {
      expect(screen.getByText('PO-LEGACY')).toBeInTheDocument();
    });
    expect(screen.getByText('qc_hold')).toBeInTheDocument();
    expect(container.firstChild).not.toBeNull();
  });
});
