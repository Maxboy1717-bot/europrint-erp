/**
 * @module AddQuestionDialog.test
 * @description Component tests for AddQuestionDialog — open state, question
 * textarea, option inputs, cancel callback, type select.
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

import { AddQuestionDialog } from '../AddQuestionDialog';

describe('AddQuestionDialog', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('renders dialog title when open is true', () => {
    render(
      <AddQuestionDialog open={true} onOpenChange={vi.fn()} testId="t-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/yangiSavolQoshish/i)).toBeTruthy();
  });

  it('renders question textarea when open', () => {
    render(
      <AddQuestionDialog open={true} onOpenChange={vi.fn()} testId="t-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-question')).toBeTruthy();
  });

  it('renders MCQ option inputs by default when type is mcq', () => {
    render(
      <AddQuestionDialog open={true} onOpenChange={vi.fn()} testId="t-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-option-0')).toBeTruthy();
    expect(screen.getByTestId('input-option-1')).toBeTruthy();
  });

  it('updates question textarea when user types', () => {
    render(
      <AddQuestionDialog open={true} onOpenChange={vi.fn()} testId="t-1" />,
      { wrapper: TestProviders },
    );
    const question = screen.getByTestId('input-question') as HTMLTextAreaElement;
    fireEvent.change(question, { target: { value: 'What is X?' } });
    expect(question.value).toBe('What is X?');
  });

  it('renders category input when dialog opens', () => {
    render(
      <AddQuestionDialog open={true} onOpenChange={vi.fn()} testId="t-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-category')).toBeTruthy();
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <AddQuestionDialog open={true} onOpenChange={onOpenChange} testId="t-1" />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
