/**
 * @module EuroprintLogo.test
 * @description Component tests for EuroprintLogo — image rendering, error
 * fallback, custom height, className passthrough, default height.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { EuroprintLogo } from '../EuroprintLogo';

describe('EuroprintLogo', () => {
  it('renders logo image when no error has occurred', () => {
    const { container } = render(<EuroprintLogo />, { wrapper: TestProviders });
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
  });

  it('uses default height when not provided', () => {
    const { container } = render(<EuroprintLogo />, { wrapper: TestProviders });
    const img = container.querySelector('img');
    expect(img?.getAttribute('height')).toBe('28');
  });

  it('uses custom height when prop provided', () => {
    const { container } = render(
      <EuroprintLogo height={40} />,
      { wrapper: TestProviders },
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('height')).toBe('40');
  });

  it('applies custom className to image when provided', () => {
    const { container } = render(
      <EuroprintLogo className="my-cls" />,
      { wrapper: TestProviders },
    );
    const img = container.querySelector('img');
    expect(img?.className).toContain('my-cls');
  });

  it('renders text fallback when image load fails', () => {
    const { container } = render(<EuroprintLogo />, { wrapper: TestProviders });
    const img = container.querySelector('img');
    if (img) fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders draggable false on image when mounted', () => {
    const { container } = render(<EuroprintLogo />, { wrapper: TestProviders });
    const img = container.querySelector('img');
    expect(img?.getAttribute('draggable')).toBe('false');
  });
});
