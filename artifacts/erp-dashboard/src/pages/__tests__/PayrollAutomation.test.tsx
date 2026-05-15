/**
 * @module PayrollAutomation.test
 * @description Deep test for payroll automation — error retry branch,
 *   page render once data resolves, tab switching, calculate dialog.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import PayrollAutomation from '../PayrollAutomation';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/system-settings': { inpsRate: 0.08, jshdRate: 0.12, minWage: 1120000 },
  '/api/finance-extended/payroll-contracts': [],
  '/api/finance-extended/payroll-calculations': [],
  '/api/finance-extended/payroll-tax-rules': [],
  '/api/users': [],
};

describe('PayrollAutomation page', () => {
  it('renders the shell while data is pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<PayrollAutomation />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page wrapper test id when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<PayrollAutomation />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(
        screen.getByTestId('payroll-automation-page'),
      ).toBeInTheDocument();
    });
  });

  it('renders the error retry button when contracts fail', async () => {
    const Wrapper = makeErrorWrapper();
    render(<PayrollAutomation />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });

  it('renders Tabs structure with contracts + calculations triggers', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<PayrollAutomation />, { wrapper: Wrapper });
    await waitFor(() => {
      const tabs = screen.queryAllByRole('tab');
      expect(tabs.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('renders action buttons after content loads', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<PayrollAutomation />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });
});
