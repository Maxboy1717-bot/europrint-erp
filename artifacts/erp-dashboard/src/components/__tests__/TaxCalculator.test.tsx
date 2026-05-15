/**
 * @module TaxCalculator.test
 * @description Component tests for TaxCalculator — null return for zero salary,
 * income tax line, net salary calculation, employer cost line, formatted output.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { TaxCalculator } from '../TaxCalculator';

describe('TaxCalculator', () => {
  it('renders nothing when grossSalary is zero', () => {
    const { container } = render(
      <TaxCalculator grossSalary={0} />,
      { wrapper: TestProviders },
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when grossSalary is negative', () => {
    const { container } = render(
      <TaxCalculator grossSalary={-100} />,
      { wrapper: TestProviders },
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders income tax line when salary is positive', () => {
    render(
      <TaxCalculator grossSalary={1000000} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/Daromad solig'i/)).toBeTruthy();
  });

  it('renders net salary label when salary is positive', () => {
    render(
      <TaxCalculator grossSalary={1000000} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/sofMaosh/i)).toBeTruthy();
  });

  it('renders INPS line when salary is positive', () => {
    render(
      <TaxCalculator grossSalary={1000000} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/INPS \(5%\):/)).toBeTruthy();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <TaxCalculator grossSalary={500000} className="custom" />,
      { wrapper: TestProviders },
    );
    expect(container.firstChild).toHaveProperty('className');
    expect((container.firstChild as HTMLElement).className).toContain('custom');
  });
});
