/**
 * @module BaseSalaryInput.test
 * @description Phase 2 / Task 2.5 — covers the currency-formatted input
 *   and Vysotskiy grade-picker preset behaviour.
 *
 *   Tests focus on the pure helpers (`rawDigits`, `formatWithCommas`) plus
 *   end-to-end interactions:
 *     1. helpers strip non-digits / insert thousand separators correctly,
 *     2. typing into the input emits the digit-only string upward,
 *     3. the rendered value is the comma-formatted version,
 *     4. the UZS suffix is present,
 *     5. value prop is rendered with commas,
 *     6. empty value renders empty input.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
import {
  BaseSalaryInput,
  rawDigits,
  formatWithCommas,
} from '../BaseSalaryInput';

describe('BaseSalaryInput helpers (Phase 2 / Task 2.5)', () => {
  it('rawDigits strips commas, letters, and punctuation', () => {
    expect(rawDigits('1,500,000')).toBe('1500000');
    expect(rawDigits('1.5 mln UZS')).toBe('15');
    expect(rawDigits('abc')).toBe('');
    expect(rawDigits('')).toBe('');
  });

  it('formatWithCommas inserts thousand separators', () => {
    expect(formatWithCommas('1500000')).toBe('1,500,000');
    expect(formatWithCommas('1000')).toBe('1,000');
    expect(formatWithCommas('99')).toBe('99');
    expect(formatWithCommas('')).toBe('');
  });
});

describe('BaseSalaryInput component (Phase 2 / Task 2.5)', () => {
  it('renders the value formatted with commas', () => {
    render(
      <TestProviders>
        <BaseSalaryInput value="1500000" onChange={() => undefined} />
      </TestProviders>,
    );
    const input = screen.getByTestId('input-base-salary') as HTMLInputElement;
    expect(input.value).toBe('1,500,000');
  });

  it('renders empty input when value is empty string', () => {
    render(
      <TestProviders>
        <BaseSalaryInput value="" onChange={() => undefined} />
      </TestProviders>,
    );
    const input = screen.getByTestId('input-base-salary') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('emits digit-only string when the user types commas / spaces', () => {
    const onChange = vi.fn();
    render(
      <TestProviders>
        <BaseSalaryInput value="" onChange={onChange} />
      </TestProviders>,
    );
    const input = screen.getByTestId('input-base-salary') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1,500,000' } });
    expect(onChange).toHaveBeenCalledWith('1500000');
  });

  it('shows the UZS currency suffix', () => {
    render(
      <TestProviders>
        <BaseSalaryInput value="" onChange={() => undefined} />
      </TestProviders>,
    );
    expect(screen.getByText('UZS')).toBeInTheDocument();
  });

  it('disables the input when disabled=true', () => {
    render(
      <TestProviders>
        <BaseSalaryInput value="" onChange={() => undefined} disabled />
      </TestProviders>,
    );
    expect(screen.getByTestId('input-base-salary')).toBeDisabled();
  });

  it('renders the Vysotskiy grade picker', () => {
    render(
      <TestProviders>
        <BaseSalaryInput value="" onChange={() => undefined} />
      </TestProviders>,
    );
    expect(screen.getByTestId('select-grade')).toBeInTheDocument();
  });
});
