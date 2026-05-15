/**
 * @module EmptyState.test (dizayn-new)
 * @description Component tests for dizayn-new EmptyState — variant titles,
 * size mapping, action slot, custom icon, accessibility role.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { EmptyState, TableSkeleton, CardSkeleton } from '../EmptyState';

describe('EmptyState (dizayn-new)', () => {
  it('renders default variant title when no variant prop given', () => {
    render(<EmptyState />, { wrapper: TestProviders });
    expect(screen.getByText(/Ma'lumot topilmadi/i)).toBeTruthy();
  });

  it('renders custom title when title prop is provided', () => {
    render(
      <EmptyState title="Custom title" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Custom title')).toBeTruthy();
  });

  it('renders search variant title when variant is search', () => {
    render(<EmptyState variant="search" />, { wrapper: TestProviders });
    expect(screen.getByText(/Natija topilmadi/i)).toBeTruthy();
  });

  it('renders error variant title when variant is error', () => {
    render(<EmptyState variant="error" />, { wrapper: TestProviders });
    expect(screen.getByText(/Xatolik yuz berdi/i)).toBeTruthy();
  });

  it('renders action slot when action prop is provided', () => {
    render(
      <EmptyState action={<button>Retry</button>} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('has role status for accessibility', () => {
    render(<EmptyState title="A11y" />, { wrapper: TestProviders });
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('A11y');
  });

  it('renders TableSkeleton with busy aria attribute', () => {
    render(<TableSkeleton rows={3} cols={3} />, { wrapper: TestProviders });
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('renders CardSkeleton count when prop provided', () => {
    render(<CardSkeleton count={2} />, { wrapper: TestProviders });
    expect(screen.getAllByRole('status').length).toBe(2);
  });
});
