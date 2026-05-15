/**
 * @module ProductionOrder360Timeline.smoke.test
 * @description Smoke test: render does not throw.
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
import Page from './ProductionOrder360Timeline';

describe('ProductionOrder360Timeline smoke', () => {
  it('renders without throwing', () => {
    // Component returns null when statusHistory is empty (by design), so
    // pass at least one entry to exercise the actual render path.
    const sampleHistory = [
      {
        id: 1,
        newStatus: 'created',
        changerName: 'Test User',
        changedAt: new Date().toISOString(),
      },
    ];
    const { container } = render(
      <Page statusHistory={sampleHistory} />,
      { wrapper: TestProviders },
    );
    expect(container.firstChild).not.toBeNull();
  });
});
