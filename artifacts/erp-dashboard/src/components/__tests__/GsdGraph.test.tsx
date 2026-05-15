/**
 * @module GsdGraph.test
 * @description Component tests for GsdGraph — loading skeleton, empty history,
 * canEdit button gating, chart data rendering, add-entry form toggle.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

interface QueryState {
  data: unknown;
  isLoading: boolean;
}

const queryState: { current: QueryState } = {
  current: { data: undefined, isLoading: false },
};

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQuery: () => queryState.current,
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(async () => ({ ok: true, json: async () => ({}) })),
  queryClient: { invalidateQueries: vi.fn() },
}));

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 500, height: 250 }}>{children}</div>
    ),
  };
});

import { GsdGraph } from '../GsdGraph';

describe('GsdGraph', () => {
  beforeEach(() => {
    queryState.current = { data: undefined, isLoading: false };
  });

  it('renders skeleton when query is loading', () => {
    queryState.current = { data: undefined, isLoading: true };
    const { container } = render(
      <GsdGraph employeeId="e-1" />,
      { wrapper: TestProviders },
    );
    // The Skeleton UI primitive renders an `animate-pulse` div, not a
    // class literally named "skeleton".
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('renders empty placeholder when history is empty', () => {
    queryState.current = {
      data: { definition: null, history: [], stats: {} },
      isLoading: false,
    };
    render(<GsdGraph employeeId="e-1" />, { wrapper: TestProviders });
    expect(screen.getByText(/GSD natijalari hali kiritilmagan/i)).toBeTruthy();
  });

  it('does not show add button when canEdit is false', () => {
    queryState.current = {
      data: { definition: null, history: [], stats: {} },
      isLoading: false,
    };
    render(<GsdGraph employeeId="e-1" canEdit={false} />, { wrapper: TestProviders });
    expect(screen.queryByText(/natijaKiritish/i)).toBeNull();
  });

  it('shows add button when canEdit is true', () => {
    queryState.current = {
      data: { definition: null, history: [], stats: {} },
      isLoading: false,
    };
    render(<GsdGraph employeeId="e-1" canEdit={true} />, { wrapper: TestProviders });
    expect(screen.getByText(/natijaKiritish/i)).toBeTruthy();
  });

  it('toggles add form open when add button clicked', () => {
    queryState.current = {
      data: { definition: null, history: [], stats: {} },
      isLoading: false,
    };
    render(<GsdGraph employeeId="e-1" canEdit={true} />, { wrapper: TestProviders });
    fireEvent.click(screen.getByText(/natijaKiritish/i));
    expect(screen.getByLabelText(/haftaSanasi/i)).toBeTruthy();
  });

  it('renders chart when history has entries', () => {
    queryState.current = {
      data: {
        definition: { gsd_name: 'Output', target_value: 100, unit: 'pcs', frequency: 'weekly', gsd_formula: null },
        history: [
          { week_date: '2025-01-01', week_label: 'W1', actual: 90, target: 100, variance: -10, note: null },
        ],
        stats: { lastWeekActual: 90, lastWeekTarget: 100, lastWeekVariance: -10, prevWeekActual: 85, avgActual: 87.5, totalWeeks: 2 },
      },
      isLoading: false,
    };
    render(<GsdGraph employeeId="e-1" />, { wrapper: TestProviders });
    expect(screen.getByText(/Output/)).toBeTruthy();
  });
});
