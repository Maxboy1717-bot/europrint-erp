/**
 * @module TestQuestionCard.test
 * @description Component tests for TestQuestionCard — question text rendering,
 * type/difficulty badges, options listing, edit/delete callbacks.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { TestQuestionCard, type TestQuestion } from '../TestQuestionCard';

const baseQuestion: TestQuestion = {
  id: 'q-1',
  question: 'What is 2+2?',
  type: 'mcq',
  difficulty: 'easy',
  category: 'math',
  options: ['3', '4', '5'],
};

describe('TestQuestionCard', () => {
  it('renders question text when prop provided', () => {
    render(<TestQuestionCard question={baseQuestion} />, { wrapper: TestProviders });
    expect(screen.getByText('What is 2+2?')).toBeTruthy();
  });

  it('renders difficulty badge label when easy difficulty', () => {
    render(<TestQuestionCard question={baseQuestion} />, { wrapper: TestProviders });
    expect(screen.getByText('Oson')).toBeTruthy();
  });

  it('renders type label when type is mcq', () => {
    render(<TestQuestionCard question={baseQuestion} />, { wrapper: TestProviders });
    expect(screen.getByText(/Ko'p tanlov/)).toBeTruthy();
  });

  it('renders category badge when category provided', () => {
    render(<TestQuestionCard question={baseQuestion} />, { wrapper: TestProviders });
    expect(screen.getByText('math')).toBeTruthy();
  });

  it('renders option list when options provided', () => {
    render(<TestQuestionCard question={baseQuestion} />, { wrapper: TestProviders });
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('does not render options section when options are empty', () => {
    const noOptions: TestQuestion = { ...baseQuestion, options: [] };
    render(<TestQuestionCard question={noOptions} />, { wrapper: TestProviders });
    expect(screen.queryByText(/javobVariantlari/)).toBeNull();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(
      <TestQuestionCard question={baseQuestion} onEdit={onEdit} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-edit-question-q-1'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(
      <TestQuestionCard question={baseQuestion} onDelete={onDelete} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-delete-question-q-1'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
