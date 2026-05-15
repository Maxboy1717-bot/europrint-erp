/**
 * @module Pagination.test
 * @description Component tests for Pagination — page info, navigation buttons,
 * disabled states at boundaries, onPageChange callback, page size selector.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders item range info when totalItems > 0', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        pageSize={10}
        totalItems={25}
        onPageChange={vi.fn()}
      />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('text-pagination-info').textContent).toContain('25');
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        pageSize={10}
        totalItems={25}
        onPageChange={vi.fn()}
      />,
      { wrapper: TestProviders },
    );
    const prev = screen.getByTestId('button-previous-page') as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
  });

  it('disables next button on last page', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={3}
        pageSize={10}
        totalItems={25}
        onPageChange={vi.fn()}
      />,
      { wrapper: TestProviders },
    );
    const next = screen.getByTestId('button-next-page') as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });

  it('calls onPageChange with next page when next clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        pageSize={10}
        totalItems={25}
        onPageChange={onPageChange}
      />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-next-page'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with last page when last button clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        pageSize={10}
        totalItems={50}
        onPageChange={onPageChange}
      />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-last-page'));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('renders page size selector only when onPageSizeChange provided', () => {
    const { rerender } = render(
      <Pagination
        currentPage={1}
        totalPages={3}
        pageSize={10}
        totalItems={25}
        onPageChange={vi.fn()}
      />,
      { wrapper: TestProviders },
    );
    expect(screen.queryByTestId('select-page-size')).toBeNull();

    rerender(
      <Pagination
        currentPage={1}
        totalPages={3}
        pageSize={10}
        totalItems={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('select-page-size')).toBeTruthy();
  });
});
