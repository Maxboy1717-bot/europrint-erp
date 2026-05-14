/**
 * @module useBarcode
 * @description React custom hook.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { barcodeApi } from "../api/pos-monitor.api";

export interface ScannedMaterial {
  id: number;
  code: string;
  nameUz: string;
  barcode?: string;
  unit: string;
  currentQty?: number;
  minQty?: number;
  batchId?: number;
  batchNumber?: string;
}

export interface UseBarcodeReturn {
  lastScanned: ScannedMaterial | null;
  scanning: boolean;
  error: string;
  manualInput: string;
  setManualInput: (v: string) => void;
  handleScan: (code: string) => Promise<void>;
  clearScanned: () => void;
}

const BARCODE_DEBOUNCE_MS = 150;

export function useBarcode(onFound?: (m: ScannedMaterial) => void): UseBarcodeReturn {
  const [lastScanned, setLastScanned] = useState<ScannedMaterial | null>(null);
  const [scanning, setScanning]       = useState(false);
  const [error, setError]             = useState("");
  const [manualInput, setManualInput] = useState("");
  const keyBuffer = useRef("");
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScan = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setScanning(true);
    setError("");
    try {
      const result = await barcodeApi.scan({ barcode: trimmed });
      const material = result as ScannedMaterial;
      setLastScanned(material);
      onFound?.(material);
      setManualInput("");
    } catch (e: unknown) {
      setError((e as Error).message ?? "Barcode topilmadi");
      setLastScanned(null);
    } finally {
      setScanning(false);
    }
  }, [onFound]);

  // USB/Bluetooth scanner keyboard event interception
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName?.toLowerCase();
      // Only intercept when not in an input field
      if (tag === "input" || tag === "textarea") return;

      if (e.key === "Enter") {
        const code = keyBuffer.current;
        keyBuffer.current = "";
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        if (code.length >= 6) void handleScan(code);
        return;
      }

      if (e.key.length === 1) {
        keyBuffer.current += e.key;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          const code = keyBuffer.current;
          keyBuffer.current = "";
          if (code.length >= 6) void handleScan(code);
        }, BARCODE_DEBOUNCE_MS);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleScan]);

  const clearScanned = useCallback(() => {
    setLastScanned(null);
    setError("");
  }, []);

  return { lastScanned, scanning, error, manualInput, setManualInput, handleScan, clearScanned };
}
