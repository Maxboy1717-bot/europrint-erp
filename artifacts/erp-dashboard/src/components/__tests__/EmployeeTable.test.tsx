/**
 * @module EmployeeTable.test
 * @description Component tests for EmployeeTable — header row, empty state,
 * data rendering, status badges, action callbacks.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProviders } from '@/test/TestProviders';


const { toastSpy } = vi.hoisted(() => ({
    toastSpy: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(async () => ({ ok: true, json: async () => ({}) })),
  queryClient: { invalidateQueries: vi.fn() },
  getAuthHeaders: () => ({}),
}));

vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/format', () => ({
  formatDate: (d?: string) => d ?? '—',
}));

import { EmployeeTable, type Employee } from '../EmployeeTable';

const baseEmployee: Employee = {
  id: 'e-1',
  fullName: 'Alisher Karimov',
  employeeId: 'EP-001',
  status: 'active',
  coursesCompleted: 5,
  coursesTotal: 10,
};

describe('EmployeeTable', () => {
  beforeEach(() => {
    toastSpy.mockReset();
  });

  it('renders header row when employees array is empty', () => {
    render(<EmployeeTable employees={[]} />, { wrapper: TestProviders });
    expect(screen.getByRole('table')).toBeTruthy();
  });

  it('renders one row per employee when items provided', () => {
    const employees: Employee[] = [
      { ...baseEmployee, id: 'e-1', fullName: 'Alisher Karimov' },
      { ...baseEmployee, id: 'e-2', fullName: 'Bobur Saidov' },
    ];
    render(<EmployeeTable employees={employees} />, { wrapper: TestProviders });
    expect(screen.getByText('Alisher Karimov')).toBeTruthy();
    expect(screen.getByText('Bobur Saidov')).toBeTruthy();
  });

  it('shows correct status badge when employee status is active', () => {
    render(<EmployeeTable employees={[baseEmployee]} />, { wrapper: TestProviders });
    expect(screen.getByText(/Ishlamoqda/i)).toBeTruthy();
  });

  it('shows resigned badge when employee status is resigned', () => {
    const resigned: Employee = { ...baseEmployee, status: 'resigned' };
    render(<EmployeeTable employees={[resigned]} />, { wrapper: TestProviders });
    expect(screen.getByText(/Ishdan ketgan/i)).toBeTruthy();
  });

  it('calls onEmployeeClick when row is clicked', () => {
    const onEmployeeClick = vi.fn();
    render(
      <EmployeeTable employees={[baseEmployee]} onEmployeeClick={onEmployeeClick} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('row-employee-e-1'));
    expect(onEmployeeClick).toHaveBeenCalledWith(baseEmployee);
  });

  it('shows failed tests badge when employee has failed tests', () => {
    const withFailedTests: Employee = { ...baseEmployee, failedTests: 3 };
    render(<EmployeeTable employees={[withFailedTests]} />, { wrapper: TestProviders });
    expect(screen.getByTestId('badge-failed-tests-e-1').textContent).toContain('3');
  });

  it('handles missing optional fields gracefully when no telegram id', () => {
    render(<EmployeeTable employees={[baseEmployee]} />, { wrapper: TestProviders });
    // Should render dashes for missing telegramChatId
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
