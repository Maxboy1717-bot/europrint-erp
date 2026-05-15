/**
 * @module useLivenessDetection.test
 * @description Vitest tests for the useLivenessDetection hook (state surface).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/lib/faceApiLoader', () => ({
  loadFaceApi: vi.fn(),
}));

import { useLivenessDetection } from './useLivenessDetection';

function makeRef(el: HTMLVideoElement | null = null) {
  return { current: el } as unknown as React.RefObject<HTMLVideoElement | null>;
}

describe('useLivenessDetection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts in idle status with zero blink count', () => {
    const ref = makeRef(null);
    const { result } = renderHook(() => useLivenessDetection(ref));
    expect(result.current.status).toBe('idle');
    expect(result.current.blinkCount).toBe(0);
    expect(result.current.isDetecting).toBe(false);
  });

  it('starts with full time remaining (15 seconds)', () => {
    const ref = makeRef(null);
    const { result } = renderHook(() => useLivenessDetection(ref));
    expect(result.current.timeRemaining).toBe(15);
  });

  it('exposes the documented action functions', () => {
    const ref = makeRef(null);
    const { result } = renderHook(() => useLivenessDetection(ref));
    expect(typeof result.current.startChallenge).toBe('function');
    expect(typeof result.current.stopChallenge).toBe('function');
    expect(typeof result.current.resetLiveness).toBe('function');
  });

  it('startChallenge is a no-op when videoRef is null', () => {
    const ref = makeRef(null);
    const { result } = renderHook(() => useLivenessDetection(ref));
    act(() => {
      result.current.startChallenge();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.isDetecting).toBe(false);
  });

  it('stopChallenge does not change state when never started', () => {
    const ref = makeRef(null);
    const { result } = renderHook(() => useLivenessDetection(ref));
    act(() => {
      result.current.stopChallenge();
    });
    expect(result.current.isDetecting).toBe(false);
    expect(result.current.status).toBe('idle');
  });

  it('resetLiveness returns hook to idle defaults', () => {
    const ref = makeRef(null);
    const { result } = renderHook(() => useLivenessDetection(ref));
    act(() => {
      result.current.resetLiveness();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.blinkCount).toBe(0);
    expect(result.current.timeRemaining).toBe(15);
    expect(result.current.isDetecting).toBe(false);
  });
});
