/**
 * @module use-navigate.test
 * @description Vitest tests for the useNavigate hook (wouter wrapper).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { setLocationMock } = vi.hoisted(() => ({
  setLocationMock: vi.fn(),
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/', setLocationMock] as const,
}));

import { useNavigate } from './use-navigate';

describe('useNavigate', () => {
  beforeEach(() => {
    setLocationMock.mockReset();
  });

  it('returns a function value', () => {
    const { result } = renderHook(() => useNavigate());
    expect(typeof result.current).toBe('function');
  });

  it('calls setLocation with the supplied path', () => {
    const { result } = renderHook(() => useNavigate());
    result.current('/dashboard');
    expect(setLocationMock).toHaveBeenCalledWith('/dashboard');
  });

  it('forwards each call individually to setLocation', () => {
    const { result } = renderHook(() => useNavigate());
    result.current('/a');
    result.current('/b');
    result.current('/c');
    expect(setLocationMock).toHaveBeenCalledTimes(3);
    expect(setLocationMock).toHaveBeenNthCalledWith(1, '/a');
    expect(setLocationMock).toHaveBeenNthCalledWith(3, '/c');
  });

  it('preserves query strings and hash fragments', () => {
    const { result } = renderHook(() => useNavigate());
    result.current('/orders?status=open#top');
    expect(setLocationMock).toHaveBeenCalledWith('/orders?status=open#top');
  });

  it('supports empty path string', () => {
    const { result } = renderHook(() => useNavigate());
    result.current('');
    expect(setLocationMock).toHaveBeenCalledWith('');
  });
});
