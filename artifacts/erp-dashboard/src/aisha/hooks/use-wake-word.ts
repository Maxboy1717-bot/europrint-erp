/**
 * @module aisha/hooks/use-wake-word
 * @description Thin wrapper around @picovoice/porcupine-web. The real
 * Porcupine lib is loaded lazily so this hook stays usable in tests where
 * the SDK isn't installed.
 */

import { useEffect, useRef, useState } from 'react';

interface UseWakeWordOpts {
  onWake:       () => void;
  accessKey:    string | null;
  ppnUrl:       string;
  sensitivity:  number;
  enabled:      boolean;
}

export function useWakeWord({ onWake, accessKey, ppnUrl, sensitivity, enabled }: UseWakeWordOpts) {
  const [error, setError] = useState<string | null>(null);
  const detachRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !accessKey) return;
    let cancelled = false;
    (async () => {
      try {
        // The shape we use is a strict subset of the real porcupine-web SDK,
        // which accepts additional `model` / `options` args we don't need.
        // Widen via `unknown` so the assignment doesn't trip on missing args.
        const porcupine = (await import(/* webpackIgnore: true */ '@picovoice/porcupine-web')) as unknown as {
          PorcupineWorker: {
            create(key: string, kw: Array<{ publicPath: string; label: string; sensitivity: number }>,
                   cb: (det: { label: string }) => void): Promise<{ release(): Promise<void> }>;
          };
        };
        const worker = await porcupine.PorcupineWorker.create(
          accessKey,
          [{ publicPath: ppnUrl, label: 'aisha', sensitivity }],
          (det) => { if (det.label === 'aisha') onWake(); },
        );
        if (cancelled) { void worker.release(); return; }
        detachRef.current = () => { void worker.release(); };
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
      detachRef.current?.();
      detachRef.current = null;
    };
  }, [onWake, accessKey, ppnUrl, sensitivity, enabled]);

  return { error };
}
