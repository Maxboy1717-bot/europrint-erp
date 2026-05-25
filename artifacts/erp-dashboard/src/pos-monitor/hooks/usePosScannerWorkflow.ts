/**
 * @module usePosScannerWorkflow
 * @description Page-specific wrapper around useHardwareScanner.
 *   Adds barcode lookup + audio/vibration feedback + toast notifications.
 *
 *   Use this on warehouse pages instead of useHardwareScanner directly.
 *
 * @layer Hook (POS Monitor)
 */

import { useCallback, useEffect } from 'react';
import { useHardwareScanner, type ScanEvent } from './useHardwareScanner';
import { barcodeApi } from '../api/pos-monitor.api';

type BarcodeMaterial = {
  id: number;
  name: string;
  sku: string;
  unit: string;
};

type ScanLookupResult =
  | { ok: true; barcode: string; material: BarcodeMaterial }
  | { ok: false; barcode: string; reason: 'not_found' | 'error'; error?: string };

interface PosScannerWorkflowOptions {
  /** Called after a successful lookup (material found in DB). */
  onFound?: (result: { material: BarcodeMaterial; event: ScanEvent }) => void;
  /** Called when barcode wasn't recognized. */
  onNotFound?: (barcode: string) => void;
  /** Called on lookup error (network, etc.). */
  onError?: (barcode: string, error: string) => void;
  /** Disable scanner (useful when modal is open). */
  disabled?: boolean;
  /** Skip barcode lookup — just emit the raw barcode (for pages that don't need material). */
  rawMode?: boolean;
}

// ─── Audio + vibration feedback ────────────────────────────────────────
function playPing(freq = 880, duration = 150) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch { /* noop */ }
}

function vibrate(pattern: number | number[]) {
  try { navigator.vibrate?.(pattern); } catch { /* noop */ }
}

export function feedbackSuccess() { playPing(880, 120); vibrate(40); }
export function feedbackError() { playPing(220, 300); vibrate([60, 60, 60]); }
export function feedbackWarn() { playPing(440, 200); vibrate(80); }

// ─── Hook ───────────────────────────────────────────────────────────────
export function usePosScannerWorkflow(options: PosScannerWorkflowOptions = {}) {
  const { onFound, onNotFound, onError, disabled = false, rawMode = false } = options;

  const handleScan = useCallback(async (event: ScanEvent) => {
    if (rawMode) {
      // Raw mode: just emit barcode without lookup (e.g., Material360 navigation)
      onFound?.({ material: { id: 0, name: '', sku: event.barcode, unit: '' }, event });
      feedbackSuccess();
      return;
    }
    try {
      const r = (await barcodeApi.scan({ barcode: event.barcode })) as { material?: BarcodeMaterial } | null;
      if (r?.material) {
        feedbackSuccess();
        onFound?.({ material: r.material, event });
      } else {
        feedbackError();
        onNotFound?.(event.barcode);
      }
    } catch (err) {
      feedbackError();
      const msg = err instanceof Error ? err.message : String(err);
      onError?.(event.barcode, msg);
    }
  }, [onFound, onNotFound, onError, rawMode]);

  const scanner = useHardwareScanner({
    onScan: handleScan,
    disableWedge: disabled,
  });

  // Expose simulate for tests + manual fallback
  useEffect(() => {
    if (!disabled) {
      // Could log connection status here
    }
  }, [disabled]);

  return {
    ...scanner,
    /** Trigger a fake scan (for manual fallback button). */
    simulateScan: (barcode: string) => void handleScan({ barcode, source: 'manual', timestamp: Date.now() }),
  };
}
