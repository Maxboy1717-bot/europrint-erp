/**
 * @module AssignCourseDialog.test
 * @description Component tests for AssignCourseDialog — open state, employee
 * filter, date inputs, no users message, cancel callback.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProviders } from '@/test/TestProviders';


const { apiRequestMock, toastSpy } = vi.hoisted(() => ({
    apiRequestMock: vi.fn(async () => ({ ok: true })),
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
  apiRequest: apiRequestMock,
  queryClient: { invalidateQueries: vi.fn() },
  getAuthHeaders: () => ({}),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
      if (queryKey[0] === '/api/employees') {
        return {
          data: { data: [{ id: 'u-1', fullName: 'Test User', employeeId: 'EP-001' }] },
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    },
  };
});

vi.mock('@/components/ep', () => ({
  EPLoader: () => <span>loading</span>,
}));

import { AssignCourseDialog } from '../AssignCourseDialog';

describe('AssignCourseDialog', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('renders dialog title when open is true', () => {
    render(
      <AssignCourseDialog
        open={true}
        onOpenChange={vi.fn()}
        courseId="c-1"
        courseTitle="Safety Course"
      />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/kursniTayinlash/i)).toBeTruthy();
  });

  it('shows course title in description when prop provided', () => {
    render(
      <AssignCourseDialog
        open={true}
        onOpenChange={vi.fn()}
        courseId="c-1"
        courseTitle="Safety Course"
      />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/Safety Course/)).toBeTruthy();
  });

  it('renders start date input when open', () => {
    render(
      <AssignCourseDialog
        open={true}
        onOpenChange={vi.fn()}
        courseId="c-1"
        courseTitle="Safety"
      />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-start-date')).toBeTruthy();
  });

  it('renders user list when employees are loaded', () => {
    render(
      <AssignCourseDialog
        open={true}
        onOpenChange={vi.fn()}
        courseId="c-1"
        courseTitle="Safety"
      />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('user-u-1')).toBeTruthy();
  });

  it('toggles user selection when row clicked', () => {
    render(
      <AssignCourseDialog
        open={true}
        onOpenChange={vi.fn()}
        courseId="c-1"
        courseTitle="Safety"
      />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('user-u-1'));
    expect(screen.getByText(/1 \/ 1 tanlangan/)).toBeTruthy();
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <AssignCourseDialog
        open={true}
        onOpenChange={onOpenChange}
        courseId="c-1"
        courseTitle="Safety"
      />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
