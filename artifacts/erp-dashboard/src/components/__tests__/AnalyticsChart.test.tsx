/**
 * @module AnalyticsChart.test
 * @description Component tests for AnalyticsChart — title rendering, chart
 * container, data prop handling, empty data, recharts wrapper.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 500, height: 300 }}>
        {children}
      </div>
    ),
  };
});

import { AnalyticsChart } from '../AnalyticsChart';

describe('AnalyticsChart', () => {
  it('renders title when title prop is provided', () => {
    render(
      <AnalyticsChart title="Quarterly Stats" data={[]} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Quarterly Stats')).toBeTruthy();
  });

  it('renders responsive container when chart mounts', () => {
    render(
      <AnalyticsChart title="Stats" data={[{ name: 'A', value: 10 }]} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('responsive-container')).toBeTruthy();
  });

  it('handles empty data array without crashing', () => {
    render(
      <AnalyticsChart title="Empty" data={[]} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Empty')).toBeTruthy();
  });

  it('renders chart when multiple data points are provided', () => {
    const data = [
      { name: 'Jan', value: 100 },
      { name: 'Feb', value: 200 },
      { name: 'Mar', value: 150 },
    ];
    render(
      <AnalyticsChart title="Monthly" data={data} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Monthly')).toBeTruthy();
  });

  it('renders different titles when prop changes', () => {
    const { rerender } = render(
      <AnalyticsChart title="First" data={[]} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('First')).toBeTruthy();

    rerender(<AnalyticsChart title="Second" data={[]} />);
    expect(screen.getByText('Second')).toBeTruthy();
  });
});
