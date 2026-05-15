/**
 * @module AddDisciplineDialog.test
 * @description Component tests for AddDisciplineDialog — open state, type select,
 * reason input, submit blocked until required filled, cancel callback.
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
      data: { data: [{ id: 'u-1', fullName: 'Alisher', employeeId: 'EP-001', role: 'admin' }] },
      isLoading: false,
    }),
  };
});

vi.mock('@/components/ep', () => ({
  EPLoader: () => <span>loading</span>,
}));

import { AddDisciplineDialog } from '../AddDisciplineDialog';

describe('AddDisciplineDialog', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('renders dialog title when open is true', () => {
    render(
      <AddDisciplineDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/intizomYozuviQoshish/i)).toBeTruthy();
  });

  it('renders reason textarea when dialog is open', () => {
    render(
      <AddDisciplineDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-reason')).toBeTruthy();
  });

  it('updates reason field when user types', () => {
    render(
      <AddDisciplineDialog open={true} onOpenChange={vi.fn()} userId="u-1" />,
      { wrapper: TestProviders },
    );
    const reason = screen.getByTestId('input-reason') as HTMLTextAreaElement;
    fireEvent.change(reason, { target: { value: 'Kech qoldi' } });
    expect(reason.value).toBe('Kech qoldi');
  });

  it('calls onOpenChange when cancel button clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <AddDisciplineDialog open={true} onOpenChange={onOpenChange} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables submit when userId not selected', () => {
    render(
      <AddDisciplineDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    const submit = screen.getByTestId('button-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('does not render dialog content when open is false', () => {
    render(
      <AddDisciplineDialog open={false} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.queryByTestId('input-reason')).toBeNull();
  });
});
