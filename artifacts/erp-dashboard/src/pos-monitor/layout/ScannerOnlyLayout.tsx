/**
 * @module ScannerOnlyLayout
 * @description Full-screen kiosk wrapper for warehouse operators using gloves.
 *   No mouse, no keyboard typing — only barcode scanner + giant visual feedback.
 *   Toggle via header chip; persists in localStorage.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { ScannerStatus } from '../components/ScannerStatus';

const STORAGE_KEY = 'pos_scanner_only_mode';

export function useScannerOnlyMode() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch { /* noop */ }
  }, [enabled]);
  return { enabled, setEnabled, toggle: () => setEnabled(v => !v) };
}

interface Props {
  children: ReactNode;
  /** Last scan feedback to display center-screen (auto-clears after 2s). */
  lastBarcode?: string;
  lastResult?: 'success' | 'error' | 'warn' | null;
  /** Operator action title (e.g. "Kirim", "Chiqim", "Sanab"). */
  modeTitle?: string;
}

export function ScannerOnlyLayout({ children, lastBarcode, lastResult, modeTitle = 'Skaner rejimi' }: Props) {
  const [flash, setFlash] = useState<typeof lastResult>(null);

  useEffect(() => {
    if (!lastResult) return;
    setFlash(lastResult);
    const t = setTimeout(() => setFlash(null), 1800);
    return () => clearTimeout(t);
  }, [lastResult, lastBarcode]);

  const flashColor = flash === 'success' ? 'rgba(34,197,94,0.85)' :
                     flash === 'error'   ? 'rgba(239,68,68,0.85)' :
                     flash === 'warn'    ? 'rgba(245,158,11,0.85)' : 'transparent';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0a0a0a', color: '#fff',
        display: 'flex', flexDirection: 'column',
        userSelect: 'none', cursor: 'none',
      }}
    >
      {/* Top bar */}
      <div style={{
        padding: '20px 28px', borderBottom: '1px solid #1f1f1f',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 18,
      }}>
        <div style={{ fontWeight: 700 }}>📷 {modeTitle}</div>
        <ScannerStatus compact />
      </div>

      {/* Main work area */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {children}
      </div>

      {/* Center-screen flash feedback */}
      {flash && (
        <div style={{
          position: 'absolute', inset: 0,
          background: flashColor,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          animation: 'pos-scanner-flash 1.5s ease-out',
        }}>
          <div style={{ fontSize: 96 }}>
            {flash === 'success' ? '✓' : flash === 'error' ? '✗' : '!'}
          </div>
          {lastBarcode && (
            <div style={{ fontSize: 24, fontFamily: 'monospace', marginTop: 12 }}>
              {lastBarcode}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pos-scanner-flash {
          0% { opacity: 0.9; }
          80% { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
