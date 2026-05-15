/**
 * @module AssignAIExamDialog.test
 * @description Component tests for AssignAIExamDialog — open state, employee
 * listing, toggle-all action, submit disabled when no users selected, cancel.
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
          data: { data: [{ id: 'u-1', fullName: 'Test User', employeeId: 'EP-001', positionId: 'p-1' }] },
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

import { AssignAIExamDialog } from '../AssignAIExamDialog';

describe('AssignAIExamDialog', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('renders dialog title when open is true', () => {
    render(
      <AssignAIExamDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/aiImtixonTayinlash/i)).toBeTruthy();
  });

  it('renders department filter select when open', () => {
    render(
      <AssignAIExamDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('select-org-structure-filter')).toBeTruthy();
  });

  it('renders user list when employees are loaded', () => {
    render(
      <AssignAIExamDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('user-item-u-1')).toBeTruthy();
  });

  it('disables submit when no users are selected', () => {
    render(
      <AssignAIExamDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    const submit = screen.getByTestId('button-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('toggles all users when toggle-all button is clicked', () => {
    render(
      <AssignAIExamDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-toggle-all'));
    expect(screen.getByText(/1 \/ 1 tanlangan/)).toBeTruthy();
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <AssignAIExamDialog open={true} onOpenChange={onOpenChange} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
