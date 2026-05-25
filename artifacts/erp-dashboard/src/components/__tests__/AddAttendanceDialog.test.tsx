/**
 * @module AddAttendanceDialog.test
 * @description Component tests for AddAttendanceDialog — open state, date input,
 * status select, minutes-late field, cancel callback, employee selector.
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
    useQuery: () => ({
      data: { data: [{ id: 'u-1', fullName: 'Test Employee', employeeId: 'EP-001' }] },
      isLoading: false,
    }),
  };
});

vi.mock('@/components/ep', () => ({
  EPLoader: () => <span>loading</span>,
}));

import { AddAttendanceDialog } from '../AddAttendanceDialog';

describe('AddAttendanceDialog', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('renders dialog title when open is true', () => {
    render(
      <AddAttendanceDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/davomatQoshish/i)).toBeTruthy();
  });

  it('renders date input when open', () => {
    render(
      <AddAttendanceDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-date')).toBeTruthy();
  });

  it('renders minutes late input when open', () => {
    render(
      <AddAttendanceDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-minutes-late')).toBeTruthy();
  });

  it('renders check-in and check-out time inputs', () => {
    render(
      <AddAttendanceDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-check-in')).toBeTruthy();
    expect(screen.getByTestId('input-check-out')).toBeTruthy();
  });

  it('renders notes textarea when open', () => {
    render(
      <AddAttendanceDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-notes')).toBeTruthy();
  });

  it('disables submit when userId is not set', () => {
    render(
      <AddAttendanceDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    const submit = screen.getByTestId('button-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <AddAttendanceDialog open={true} onOpenChange={onOpenChange} userId="u-1" />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
