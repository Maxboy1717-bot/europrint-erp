/**
 * @module AddLessonDialog.test
 * @description Component tests for AddLessonDialog — open state, title field,
 * type select, video URL input visibility, cancel callback.
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

import { AddLessonDialog } from '../AddLessonDialog';

describe('AddLessonDialog', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('renders dialog title when open is true', () => {
    render(
      <AddLessonDialog open={true} onOpenChange={vi.fn()} moduleId="m-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/yangiDarsQoshish/i)).toBeTruthy();
  });

  it('renders lesson title input when open', () => {
    render(
      <AddLessonDialog open={true} onOpenChange={vi.fn()} moduleId="m-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-lesson-title')).toBeTruthy();
  });

  it('renders Russian title input when open', () => {
    render(
      <AddLessonDialog open={true} onOpenChange={vi.fn()} moduleId="m-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-lesson-title-ru')).toBeTruthy();
  });

  it('updates title input when user types', () => {
    render(
      <AddLessonDialog open={true} onOpenChange={vi.fn()} moduleId="m-1" />,
      { wrapper: TestProviders },
    );
    const input = screen.getByTestId('input-lesson-title') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Yangi dars' } });
    expect(input.value).toBe('Yangi dars');
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <AddLessonDialog open={true} onOpenChange={onOpenChange} moduleId="m-1" />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not render content when open is false', () => {
    render(
      <AddLessonDialog open={false} onOpenChange={vi.fn()} moduleId="m-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.queryByTestId('input-lesson-title')).toBeNull();
  });
});
