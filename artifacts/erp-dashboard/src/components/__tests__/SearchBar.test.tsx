/**
 * @module SearchBar.test
 * @description Component tests for SearchBar — placeholder rendering, controlled
 * value, onChange callback, default placeholder fallback, custom class.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  it('renders search input when mounted', () => {
    render(<SearchBar />, { wrapper: TestProviders });
    expect(screen.getByTestId('input-search')).toBeTruthy();
  });

  it('uses custom placeholder when prop provided', () => {
    render(
      <SearchBar placeholder="Type to search" />,
      { wrapper: TestProviders },
    );
    const input = screen.getByTestId('input-search') as HTMLInputElement;
    expect(input.placeholder).toBe('Type to search');
  });

  it('uses translation fallback placeholder when not provided', () => {
    render(<SearchBar />, { wrapper: TestProviders });
    const input = screen.getByTestId('input-search') as HTMLInputElement;
    expect(input.placeholder.length).toBeGreaterThan(0);
  });

  it('renders controlled value when value prop set', () => {
    render(<SearchBar value="hello" />, { wrapper: TestProviders });
    const input = screen.getByTestId('input-search') as HTMLInputElement;
    expect(input.value).toBe('hello');
  });

  it('calls onChange with new value when user types', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />, { wrapper: TestProviders });
    const input = screen.getByTestId('input-search') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'q' } });
    expect(onChange).toHaveBeenCalledWith('q');
  });

  it('applies extra className when provided', () => {
    render(
      <SearchBar className="custom-cls" />,
      { wrapper: TestProviders },
    );
    const input = screen.getByTestId('input-search');
    expect(input.className).toContain('custom-cls');
  });
});
