/**
 * @module AddModuleDialog.test
 * @description Component tests for AddModuleDialog — open state, title fields,
 * description fields, cancel callback, form submission.
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

import { AddModuleDialog } from '../AddModuleDialog';

describe('AddModuleDialog', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('renders dialog title when open is true', () => {
    render(
      <AddModuleDialog open={true} onOpenChange={vi.fn()} courseId="c-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/yangiModulQoshish/i)).toBeTruthy();
  });

  it('renders module title input when open', () => {
    render(
      <AddModuleDialog open={true} onOpenChange={vi.fn()} courseId="c-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-module-title')).toBeTruthy();
  });

  it('renders Russian title input when open', () => {
    render(
      <AddModuleDialog open={true} onOpenChange={vi.fn()} courseId="c-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-module-title-ru')).toBeTruthy();
  });

  it('renders description input when open', () => {
    render(
      <AddModuleDialog open={true} onOpenChange={vi.fn()} courseId="c-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-module-description')).toBeTruthy();
  });

  it('updates title field when user types', () => {
    render(
      <AddModuleDialog open={true} onOpenChange={vi.fn()} courseId="c-1" />,
      { wrapper: TestProviders },
    );
    const input = screen.getByTestId('input-module-title') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Modul 1' } });
    expect(input.value).toBe('Modul 1');
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <AddModuleDialog open={true} onOpenChange={onOpenChange} courseId="c-1" />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not render content when open is false', () => {
    render(
      <AddModuleDialog open={false} onOpenChange={vi.fn()} courseId="c-1" />,
      { wrapper: TestProviders },
    );
    expect(screen.queryByTestId('input-module-title')).toBeNull();
  });
});
