/**
 * @module MROExtendedPanels.smoke.test
 * @description Smoke test: render does not throw.
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
import { PMUpcomingPanel as Page } from './MROExtendedPanels';

describe('MROExtendedPanels smoke', () => {
  it('renders without throwing', () => {
    const { container } = render(<Page />, { wrapper: TestProviders });
    expect(container.firstChild).not.toBeNull();
  });
});
