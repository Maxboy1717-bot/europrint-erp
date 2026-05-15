/**
 * @module MESExtendedTabsC.smoke.test
 * @description Smoke test: render does not throw.
 *
 * NormsTab is a Radix Tabs `<TabsContent>` panel and therefore must be
 * mounted inside a `<Tabs>` ancestor — the smoke test wraps it accordingly.
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
import { Tabs } from '@/components/ui/tabs';
import { NormsTab as Page } from './MESExtendedTabsC';

describe('MESExtendedTabsC smoke', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Tabs defaultValue="norms"><Page /></Tabs>,
      { wrapper: TestProviders },
    );
    expect(container.firstChild).not.toBeNull();
  });
});
