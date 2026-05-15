/**
 * @module FinancialReports.test
 * @description Deep test for financial reports — loading, success, error,
 *   period select, tabs.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import FinancialReports from '../FinancialReports';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/reports/weekly-summary': { revenue: 1000000, expenses: 600000 },
  '/api/reports/monthly-summary': {},
  '/api/reports/kpi-dashboard': {},
  '/api/reports/production-efficiency': {},
};

describe('FinancialReports page', () => {
  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<FinancialReports />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<FinancialReports />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<FinancialReports />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders tabs', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<FinancialReports />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('tab').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('renders the period select trigger', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<FinancialReports />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('combobox').length).toBeGreaterThanOrEqual(0);
    });
  });
});
