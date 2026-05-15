/**
 * @module HRSafety.smoke.test
 * @description Smoke test: render does not throw.
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
import Page from './HRSafety';

describe('HRSafety smoke', () => {
  it('renders without throwing', () => {
    const { container } = render(<Page />, { wrapper: TestProviders });
    expect(container.firstChild).not.toBeNull();
  });
});
