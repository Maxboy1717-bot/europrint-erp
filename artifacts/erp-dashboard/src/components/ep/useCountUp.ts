/**
 * @module useCountUp
 * @description Animates a numeric value from 0 → target over the EuroPrint
 *   standard duration (~1.2s, cubic-out easing). Used by KPI cards and stat
 *   counters so big numbers feel alive on mount.
 *
 *   Honors `prefers-reduced-motion`: returns the final value immediately.
 */

import { useEffect, useRef, useState } from "react";

export interface UseCountUpOptions {
  /** Duration in ms. Default 1200. */
  durationMs?: number;
  /** Re-run animation when this value changes. */
  resetKey?: string | number;
}

const cubicOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function useCountUp(target: number, options: UseCountUpOptions = {}): number {
  const { durationMs = 1200, resetKey } = options;
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Respect reduced-motion users — skip the animation entirely.
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) {
        setValue(target);
        return;
      }
    }

    const safeTarget = Number.isFinite(target) ? target : 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      setValue(safeTarget * cubicOut(progress));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(safeTarget);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // resetKey lets callers re-trigger the animation explicitly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs, resetKey]);

  return value;
}
