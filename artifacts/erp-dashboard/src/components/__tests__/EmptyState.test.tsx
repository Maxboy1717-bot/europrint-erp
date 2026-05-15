/**
 * @module EmptyState.test
 * @description Component tests for EmptyState — title, description, action
 * rendering, variant presets, action callback.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders custom title and description when both provided', () => {
    render(
      <EmptyState title="No data" description="Add first record" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('No data')).toBeTruthy();
    expect(screen.getByText('Add first record')).toBeTruthy();
  });

  it('renders default variant title when none provided', () => {
    render(<EmptyState />, { wrapper: TestProviders });
    expect(screen.getByText(/Ma'lumot topilmadi/i)).toBeTruthy();
  });

  it('renders action button when actionLabel and onAction provided', () => {
    const onAction = vi.fn();
    render(
      <EmptyState actionLabel="Add" onAction={onAction} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('button-empty-state-action')).toBeTruthy();
  });

  it('calls onAction when action button is clicked', () => {
    const onAction = vi.fn();
    render(
      <EmptyState actionLabel="Add" onAction={onAction} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-empty-state-action'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders search variant title when variant is search', () => {
    render(<EmptyState variant="search" />, { wrapper: TestProviders });
    expect(screen.getByText(/Natija topilmadi/i)).toBeTruthy();
  });

  it('renders custom action element when action prop is provided', () => {
    render(
      <EmptyState action={<button>Custom Button</button>} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Custom Button')).toBeTruthy();
  });
});
