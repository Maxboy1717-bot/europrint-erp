/**
 * @module AsyncBoundary.test
 * @description Component tests for AsyncBoundary — loading / error / empty /
 * data state branches, retry callback, custom fallback.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/components/ep', () => ({
  EPLoader: () => <div data-testid="ep-loader">loading-icon</div>,
}));

import { AsyncBoundary } from '../AsyncBoundary';

describe('AsyncBoundary', () => {
  it('renders loader when isLoading is true', () => {
    render(
      <AsyncBoundary isLoading>
        <div>content</div>
      </AsyncBoundary>,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('async-loading')).toBeTruthy();
  });

  it('renders error state with retry when isError is true', () => {
    const onRetry = vi.fn();
    render(
      <AsyncBoundary isError error={new Error('boom')} onRetry={onRetry}>
        <div>content</div>
      </AsyncBoundary>,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('async-error')).toBeTruthy();
    expect(screen.getByText('boom')).toBeTruthy();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(
      <AsyncBoundary isError error="failed" onRetry={onRetry}>
        <div>content</div>
      </AsyncBoundary>,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByRole('button', { name: /qaytaUrinish/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when isEmpty is true', () => {
    render(
      <AsyncBoundary isEmpty>
        <div>content</div>
      </AsyncBoundary>,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('async-empty')).toBeTruthy();
  });

  it('renders children when no loading / error / empty flags set', () => {
    render(
      <AsyncBoundary>
        <div data-testid="actual-content">visible</div>
      </AsyncBoundary>,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('actual-content')).toBeTruthy();
  });

  it('uses custom empty text when emptyText prop is provided', () => {
    render(
      <AsyncBoundary isEmpty emptyText="Nothing here">
        <div>content</div>
      </AsyncBoundary>,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Nothing here')).toBeTruthy();
  });
});
