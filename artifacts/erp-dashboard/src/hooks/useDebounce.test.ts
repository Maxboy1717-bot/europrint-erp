/**
 * @module useDebounce.test
 * @description Vitest tests for the useDebounce hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately on first render', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('does not update value before the delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } },
    );

    rerender({ value: 'b', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('a');
  });

  it('updates the value after the delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 200 } },
    );

    rerender({ value: 'b', delay: 200 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('b');
  });

  it('resets the timer when value changes again before delay completes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } },
    );

    rerender({ value: 'b', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender({ value: 'c', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('c');
  });

  it('supports number values', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useDebounce(value, 100),
      { initialProps: { value: 1 } },
    );

    rerender({ value: 42 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe(42);
  });

  it('supports object values', () => {
    const initial = { name: 'alice' };
    const next = { name: 'bob' };
    const { result, rerender } = renderHook(
      ({ value }: { value: { name: string } }) => useDebounce(value, 100),
      { initialProps: { value: initial } },
    );

    rerender({ value: next });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toEqual({ name: 'bob' });
  });
});
