/**
 * @module AbcAnalysisCard.test
 * @description Component tests for AbcAnalysisCard — empty state, grade
 * rendering, calculate / edit callbacks, calculating pending state.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { AbcAnalysisCard } from '../AbcAnalysisCard';

describe('AbcAnalysisCard', () => {
  it('renders empty state with first-calculate button when analysis is null', () => {
    render(
      <AbcAnalysisCard analysis={null} onCalculate={vi.fn()} onEdit={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('button-first-calculate')).toBeTruthy();
  });

  it('calls onCalculate when calculate button is clicked', () => {
    const onCalculate = vi.fn();
    render(
      <AbcAnalysisCard analysis={null} onCalculate={onCalculate} onEdit={vi.fn()} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-first-calculate'));
    expect(onCalculate).toHaveBeenCalledTimes(1);
  });

  it('renders grade A label when analysis grade is A', () => {
    const analysis = {
      grade: 'A',
      score: 5,
      testPassRate: 100,
      courseCompletionRate: 100,
      performanceRate: 95,
      attendanceRate: 98,
      disciplineScore: 10,
      taskCompletionRate: 100,
      punctualityRate: 100,
      initiativeCount: 5,
    };
    render(
      <AbcAnalysisCard analysis={analysis} onCalculate={vi.fn()} onEdit={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/A - A'lo/i)).toBeTruthy();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    const analysis = {
      grade: 'B',
      score: 4,
    };
    render(
      <AbcAnalysisCard analysis={analysis} onCalculate={vi.fn()} onEdit={onEdit} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-edit-abc'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('disables calculate button when isCalculating is true', () => {
    const analysis = { grade: 'A', score: 5 };
    render(
      <AbcAnalysisCard
        analysis={analysis}
        onCalculate={vi.fn()}
        onEdit={vi.fn()}
        isCalculating
      />,
      { wrapper: TestProviders },
    );
    const button = screen.getByTestId('button-calculate-abc') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('shows notes section when analysis has notes', () => {
    const analysis = {
      grade: 'B',
      score: 4,
      notes: 'Yaxshi xodim',
    };
    render(
      <AbcAnalysisCard analysis={analysis} onCalculate={vi.fn()} onEdit={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Yaxshi xodim')).toBeTruthy();
  });
});
