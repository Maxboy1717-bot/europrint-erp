/**
 * @module AddTestDialog.test
 * @description Component tests for AddTestDialog — open state, title fields,
 * settings inputs, cancel callback, switch toggle.
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
    useQuery: () => ({ data: { data: [], pagination: { page: 1, limit: 20, total: 0 } }, isLoading: false }),
  };
});

vi.mock('@/components/ep', () => ({
  EPLoader: () => <span>loading</span>,
}));

import { AddTestDialog } from '../AddTestDialog';

describe('AddTestDialog', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('renders dialog title when open is true', () => {
    render(
      <AddTestDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/yangiTestYaratish/i)).toBeTruthy();
  });

  it('renders title input field when open', () => {
    render(
      <AddTestDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-test-title')).toBeTruthy();
  });

  it('renders pass percentage input with default 80', () => {
    render(
      <AddTestDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    const input = screen.getByTestId('input-pass-percentage') as HTMLInputElement;
    expect(input.value).toBe('80');
  });

  it('renders max attempts input with default 3', () => {
    render(
      <AddTestDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    const input = screen.getByTestId('input-max-attempts') as HTMLInputElement;
    expect(input.value).toBe('3');
  });

  it('renders randomize switch when open', () => {
    render(
      <AddTestDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('switch-randomize')).toBeTruthy();
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <AddTestDialog open={true} onOpenChange={onOpenChange} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
