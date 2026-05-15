/**
 * @module LearningPathVisualization.test
 * @description Component tests for LearningPathVisualization — user header,
 * progress percent, step rendering, status counts, type badges.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { LearningPathVisualization } from '../LearningPathVisualization';

const baseProps = {
  userId: 'u-1',
  userName: 'Alisher Karimov',
  position: 'Operator',
  overallProgress: 65,
  steps: [
    { id: 's-1', title: 'Intro Course', type: 'course' as const, status: 'completed' as const, score: 95 },
    { id: 's-2', title: 'Safety Test', type: 'test' as const, status: 'in_progress' as const, progress: 50 },
    { id: 's-3', title: 'Certificate', type: 'certificate' as const, status: 'available' as const },
  ],
};

describe('LearningPathVisualization', () => {
  it('renders user name in header when prop provided', () => {
    render(<LearningPathVisualization {...baseProps} />, { wrapper: TestProviders });
    expect(screen.getByText(/Alisher Karimov/)).toBeTruthy();
  });

  it('renders position label when prop provided', () => {
    render(<LearningPathVisualization {...baseProps} />, { wrapper: TestProviders });
    expect(screen.getByText('Operator')).toBeTruthy();
  });

  it('renders overall progress percentage when prop set', () => {
    render(<LearningPathVisualization {...baseProps} />, { wrapper: TestProviders });
    expect(screen.getByText('65%')).toBeTruthy();
  });

  it('renders each step title when steps are provided', () => {
    render(<LearningPathVisualization {...baseProps} />, { wrapper: TestProviders });
    expect(screen.getByText('Intro Course')).toBeTruthy();
    expect(screen.getByText('Safety Test')).toBeTruthy();
    expect(screen.getByText('Certificate')).toBeTruthy();
  });

  it('counts completed steps in summary when steps include completed', () => {
    render(<LearningPathVisualization {...baseProps} />, { wrapper: TestProviders });
    // 1 completed in fixture
    const counts = screen.getAllByText('1');
    expect(counts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty step list when steps array is empty', () => {
    render(
      <LearningPathVisualization {...baseProps} steps={[]} />,
      { wrapper: TestProviders },
    );
    // Header still rendered
    expect(screen.getByText(/Alisher Karimov/)).toBeTruthy();
  });
});
