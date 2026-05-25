/**
 * @module RemainingTabsLearningExtras.smoke.test
 * @description Smoke test: render does not throw.
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
import { SkillGapCard as Page } from './RemainingTabsLearningExtras';

describe('RemainingTabsLearningExtras smoke', () => {
  it('renders without throwing', () => {
    // The card returns null when there are no skill gaps. Pass either
    // loadingSkillGap=true or a non-empty gaps array so the render path
    // produces real DOM.
    const { container } = render(
      <Page loadingSkillGap={true} />,
      { wrapper: TestProviders },
    );
    expect(container.firstChild).not.toBeNull();
  });
});
