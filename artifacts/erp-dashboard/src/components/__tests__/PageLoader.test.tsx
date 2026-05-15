/**
 * @module PageLoader.test
 * @description Component tests for PageLoader — element presence, loading
 * label, EPLoader rendering, container test-id, structural classes.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/components/ep', () => ({
  EPLoader: ({ className }: { className?: string }) => (
    <div data-testid="ep-loader" className={className}>spinner</div>
  ),
}));

import { PageLoader } from '../PageLoader';

describe('PageLoader', () => {
  it('renders container with test id when mounted', () => {
    render(<PageLoader />, { wrapper: TestProviders });
    expect(screen.getByTestId('page-loader')).toBeTruthy();
  });

  it('renders EPLoader inside container when mounted', () => {
    render(<PageLoader />, { wrapper: TestProviders });
    expect(screen.getByTestId('ep-loader')).toBeTruthy();
  });

  it('renders loading label below loader when mounted', () => {
    render(<PageLoader />, { wrapper: TestProviders });
    expect(screen.getByText(/Yuklanmoqda/i)).toBeTruthy();
  });

  it('passes loader size class to EPLoader when mounted', () => {
    render(<PageLoader />, { wrapper: TestProviders });
    const loader = screen.getByTestId('ep-loader');
    expect(loader.className).toContain('w-8');
  });

  it('applies flex column layout class when rendered', () => {
    render(<PageLoader />, { wrapper: TestProviders });
    const container = screen.getByTestId('page-loader');
    expect(container.className).toContain('flex');
  });
});
