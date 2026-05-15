/**
 * @module MMExtendedTabs.smoke.test
 * @description Smoke test: render does not throw.
 *
 * CheckBotTab is a `<TabsContent>` panel — wrap in `<Tabs>`.
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
import { Tabs } from '@/components/ui/tabs';
import { CheckBotTab as Page } from './MMExtendedTabs';

describe('MMExtendedTabs smoke', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Tabs defaultValue="check-bot"><Page /></Tabs>,
      { wrapper: TestProviders },
    );
    expect(container.firstChild).not.toBeNull();
  });
});
