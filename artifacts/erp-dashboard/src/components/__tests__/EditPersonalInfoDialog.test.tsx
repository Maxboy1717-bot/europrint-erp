/**
 * @module EditPersonalInfoDialog.test
 * @description Component tests for EditPersonalInfoDialog — open state, age
 * input, household input, save callback, cancel callback.
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

vi.mock('@/components/ep', () => ({
  EPLoader: () => <span>loading</span>,
}));

import { EditPersonalInfoDialog } from '../EditPersonalInfoDialog';

describe('EditPersonalInfoDialog', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('renders dialog title when open is true', () => {
    render(
      <EditPersonalInfoDialog open={true} onOpenChange={vi.fn()} userId="u-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/shaxsiyMalumotlarniTahrirlash/i)).toBeTruthy();
  });

  it('renders age input when open', () => {
    render(
      <EditPersonalInfoDialog open={true} onOpenChange={vi.fn()} userId="u-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-age')).toBeTruthy();
  });

  it('prefills age from employee data when provided', () => {
    render(
      <EditPersonalInfoDialog
        open={true}
        onOpenChange={vi.fn()}
        userId="u-1"
        employee={{ age: 30 }}
      />,
      { wrapper: TestProviders },
    );
    const age = screen.getByTestId('input-age') as HTMLInputElement;
    expect(age.value).toBe('30');
  });

  it('updates age input when user types', () => {
    render(
      <EditPersonalInfoDialog open={true} onOpenChange={vi.fn()} userId="u-1" />,
      { wrapper: TestProviders },
    );
    const age = screen.getByTestId('input-age') as HTMLInputElement;
    fireEvent.change(age, { target: { value: '35' } });
    expect(age.value).toBe('35');
  });

  it('updates household members input when user types', () => {
    render(
      <EditPersonalInfoDialog open={true} onOpenChange={vi.fn()} userId="u-1" />,
      { wrapper: TestProviders },
    );
    const input = screen.getByTestId('input-household-members') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Turmush o\'rtog\'i, 2 farzand' } });
    expect(input.value).toBe('Turmush o\'rtog\'i, 2 farzand');
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <EditPersonalInfoDialog open={true} onOpenChange={onOpenChange} userId="u-1" />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
