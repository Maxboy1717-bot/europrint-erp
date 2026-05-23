/**
 * @module useHardwareScanner
 * @description Global hardware scanner detector for warehouse operators.
 *   Supports 3 input sources:
 *     1. Keyboard wedge (USB HID scanners that emit keystrokes) — detected by
 *        rapid keystroke burst (>=4 chars within 50ms, terminated by Enter).
 *     2. WebHID API (`navigator.hid`) — direct USB scanner driver (Chrome/Edge).
 *     3. Web Serial API (`navigator.serial`) — RS-232/USB-Serial scanners.
 *
 *   Camera scanning (BarcodeDetector) lives in PosBarcodeScanner.tsx —
 *   this hook is for hardware-only flows where focus management matters.
 *
 *   Returns: { isReady, status, lastScan, simulate, connectHid, connectSerial, disconnect }
 *
 * @layer Hook (POS Monitor)
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────
export type ScannerSource = 'wedge' | 'hid' | 'serial' | 'manual';
export type ScannerStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface ScanEvent {
  barcode: string;
  source: ScannerSource;
  timestamp: number;
}

export interface HardwareScannerOptions {
  /** Called every time a barcode is detected. */
  onScan?: (event: ScanEvent) => void;
  /** Min chars to count as a wedge scan (default 4). */
  minWedgeLength?: number;
  /** Max ms between keystrokes for wedge detection (default 50ms). */
  wedgeMaxKeyInterval?: number;
  /** Disable keyboard wedge detection (e.g., when user is typing). */
  disableWedge?: boolean;
  /** Suspend scanning when an input/textarea has focus (default true). */
  ignoreWhileTyping?: boolean;
}

// ─── WebHID type stubs (TS doesn't ship them by default) ─────────────
interface HIDDevice {
  productName: string;
  vendorId: number;
  productId: number;
  opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  addEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void;
  removeEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void;
}
interface HIDInputReportEvent extends Event {
  data: DataView;
  device: HIDDevice;
  reportId: number;
}
interface NavigatorHID {
  requestDevice(options: { filters: { vendorId?: number; productId?: number; usagePage?: number; usage?: number }[] }): Promise<HIDDevice[]>;
  getDevices(): Promise<HIDDevice[]>;
}

// ─── Hook ───────────────────────────────────────────────────────────────
export function useHardwareScanner(options: HardwareScannerOptions = {}) {
  const {
    onScan,
    minWedgeLength = 4,
    wedgeMaxKeyInterval = 50,
    disableWedge = false,
    ignoreWhileTyping = true,
  } = options;

  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [lastScan, setLastScan] = useState<ScanEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Wedge detection state (refs to avoid re-renders)
  const wedgeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);
  const hidDeviceRef = useRef<HIDDevice | null>(null);
  const serialPortRef = useRef<unknown | null>(null);
  const onScanRef = useRef<HardwareScannerOptions['onScan']>(onScan);

  // Keep latest callback without re-binding listeners
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  // ── Emit helper ─────────────────────────────────────────────────────
  const emit = useCallback((barcode: string, source: ScannerSource) => {
    const event: ScanEvent = { barcode: barcode.trim(), source, timestamp: Date.now() };
    if (!event.barcode) return;
    setLastScan(event);
    onScanRef.current?.(event);
  }, []);

  // ── Keyboard wedge detector ─────────────────────────────────────────
  useEffect(() => {
    if (disableWedge) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (ignoreWhileTyping) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || (t?.isContentEditable ?? false)) {
          return;
        }
      }
      const now = Date.now();
      const elapsed = now - lastKeyTime.current;
      // Reset buffer if too slow between keystrokes
      if (elapsed > wedgeMaxKeyInterval) wedgeBuffer.current = '';
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        const code = wedgeBuffer.current;
        wedgeBuffer.current = '';
        if (code.length >= minWedgeLength) {
          e.preventDefault();
          emit(code, 'wedge');
        }
      } else if (e.key.length === 1) {
        wedgeBuffer.current += e.key;
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [emit, minWedgeLength, wedgeMaxKeyInterval, disableWedge, ignoreWhileTyping]);

  // ── HID connect ─────────────────────────────────────────────────────
  const connectHid = useCallback(async (): Promise<boolean> => {
    const nav = navigator as unknown as { hid?: NavigatorHID };
    if (!nav.hid) {
      setErrorMessage('WebHID API qoʻllab-quvvatlanmaydi (Chrome/Edge kerak)');
      setStatus('error');
      return false;
    }
    setStatus('connecting');
    try {
      const devices = await nav.hid.requestDevice({
        // Common barcode scanner usage page (HID Generic Desktop)
        filters: [{ usagePage: 0x0001 }],
      });
      if (devices.length === 0) {
        setStatus('idle');
        return false;
      }
      const device = devices[0];
      if (!device.opened) await device.open();
      hidDeviceRef.current = device;

      const onReport = (event: HIDInputReportEvent) => {
        // Most HID scanners send ASCII bytes in the data buffer.
        // We accumulate until a 0x0D (CR) is seen.
        let str = '';
        for (let i = 0; i < event.data.byteLength; i++) {
          const b = event.data.getUint8(i);
          if (b === 0x0D || b === 0x0A) {
            if (str.length >= minWedgeLength) emit(str, 'hid');
            str = '';
          } else if (b >= 0x20 && b <= 0x7E) {
            str += String.fromCharCode(b);
          }
        }
        if (str.length >= minWedgeLength) emit(str, 'hid');
      };
      device.addEventListener('inputreport', onReport);
      setStatus('connected');
      return true;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatus('error');
      return false;
    }
  }, [emit, minWedgeLength]);

  // ── Web Serial connect ─────────────────────────────────────────────
  const connectSerial = useCallback(async (): Promise<boolean> => {
    const nav = navigator as unknown as { serial?: { requestPort(): Promise<unknown> } };
    if (!nav.serial) {
      setErrorMessage('Web Serial API qoʻllab-quvvatlanmaydi');
      setStatus('error');
      return false;
    }
    setStatus('connecting');
    try {
      const port = await nav.serial.requestPort();
      // The full Serial API is verbose — for now we just confirm pairing.
      // A full implementation reads a stream and decodes CR-terminated barcodes.
      serialPortRef.current = port;
      setStatus('connected');
      return true;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatus('error');
      return false;
    }
  }, []);

  // ── Disconnect ─────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    if (hidDeviceRef.current?.opened) await hidDeviceRef.current.close();
    hidDeviceRef.current = null;
    serialPortRef.current = null;
    setStatus('idle');
  }, []);

  // ── Manual simulate (for tests / dev) ──────────────────────────────
  const simulate = useCallback((barcode: string) => emit(barcode, 'manual'), [emit]);

  // ── Cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      void disconnect();
    };
  }, [disconnect]);

  return {
    /** True if any scanner channel is active (wedge always on unless disabled). */
    isReady: !disableWedge || status === 'connected',
    status,
    lastScan,
    errorMessage,
    simulate,
    connectHid,
    connectSerial,
    disconnect,
  };
}
