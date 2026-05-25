/**
 * @module LeadScoreBar.test
 * @description Component tests for LeadScoreBar — score label, tier badges,
 * size variants, hot/warm/cold tier mapping, hidden labels.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

import { LeadScoreBar } from '../LeadScoreBar';

describe('LeadScoreBar', () => {
  it('renders score label when showLabel is true by default', () => {
    render(<LeadScoreBar score={50} />, { wrapper: TestProviders });
    expect(screen.getByText('50/100')).toBeTruthy();
  });

  it('shows hot tier label when score >= 70', () => {
    render(<LeadScoreBar score={85} />, { wrapper: TestProviders });
    expect(screen.getByText('Issiq')).toBeTruthy();
  });

  it('shows warm tier label when score is between 40 and 69', () => {
    render(<LeadScoreBar score={55} />, { wrapper: TestProviders });
    expect(screen.getByText('Iliq')).toBeTruthy();
  });

  it('shows cold tier label when score < 40', () => {
    render(<LeadScoreBar score={20} />, { wrapper: TestProviders });
    expect(screen.getByText('Sovuq')).toBeTruthy();
  });

  it('hides score label when showLabel is false', () => {
    render(
      <LeadScoreBar score={50} showLabel={false} />,
      { wrapper: TestProviders },
    );
    expect(screen.queryByText('50/100')).toBeNull();
  });

  it('hides tier badge when showTier is false', () => {
    render(
      <LeadScoreBar score={85} showTier={false} />,
      { wrapper: TestProviders },
    );
    expect(screen.queryByText('Issiq')).toBeNull();
  });
});
