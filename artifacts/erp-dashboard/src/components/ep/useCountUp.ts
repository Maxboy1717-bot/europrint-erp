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
    let cancelled = false;

    const animate = () => {
      const startTime = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const progress = Math.min((now - startTime) / durationMs, 1);
        setValue(safeTarget * cubicOut(progress));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setValue(safeTarget);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    // In a hidden/background tab requestAnimationFrame is paused — the number
    // would be stuck at 0. Show the final value now, and animate once the tab
    // becomes visible so the count-up still plays when the user looks at it.
    if (typeof document !== "undefined" && document.hidden) {
      setValue(safeTarget);
      const onVisible = () => {
        if (!document.hidden) {
          document.removeEventListener("visibilitychange", onVisible);
          setValue(0);
          animate();
        }
      };
      document.addEventListener("visibilitychange", onVisible);
      return () => {
        cancelled = true;
        document.removeEventListener("visibilitychange", onVisible);
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }

    animate();
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // resetKey lets callers re-trigger the animation explicitly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs, resetKey]);

  return value;
}
