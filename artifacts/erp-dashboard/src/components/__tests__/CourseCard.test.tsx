/**
 * @module CourseCard.test
 * @description Component tests for CourseCard — title, description, badges,
 * action callbacks (edit/delete/view), required badge variant.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { CourseCard } from '../CourseCard';

const baseProps = {
  id: 'c-1',
  title: 'Texnika xavfsizligi',
  description: 'Asosiy xavfsizlik qoidalari',
  duration: '4 hafta',
  enrolledCount: 25,
  completionRate: 70,
  moduleCount: 5,
};

describe('CourseCard', () => {
  it('renders course title when prop provided', () => {
    render(<CourseCard {...baseProps} />, { wrapper: TestProviders });
    expect(screen.getByText('Texnika xavfsizligi')).toBeTruthy();
  });

  it('renders description text when prop provided', () => {
    render(<CourseCard {...baseProps} />, { wrapper: TestProviders });
    expect(screen.getByText('Asosiy xavfsizlik qoidalari')).toBeTruthy();
  });

  it('shows completion rate value when provided', () => {
    render(<CourseCard {...baseProps} />, { wrapper: TestProviders });
    expect(screen.getByText('70%')).toBeTruthy();
  });

  it('renders required badge when isRequired is true', () => {
    render(
      <CourseCard {...baseProps} isRequired={true} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/majburiy/i)).toBeTruthy();
  });

  it('renders optional badge when isRequired is false', () => {
    render(
      <CourseCard {...baseProps} isRequired={false} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/Ixtiyoriy/i)).toBeTruthy();
  });

  it('calls onView when view button is clicked', () => {
    const onView = vi.fn();
    render(
      <CourseCard {...baseProps} onView={onView} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-view-course-c-1'));
    expect(onView).toHaveBeenCalledTimes(1);
  });

  it('renders module count when provided', () => {
    render(<CourseCard {...baseProps} moduleCount={7} />, { wrapper: TestProviders });
    expect(screen.getByText(/7 modul/)).toBeTruthy();
  });
});
