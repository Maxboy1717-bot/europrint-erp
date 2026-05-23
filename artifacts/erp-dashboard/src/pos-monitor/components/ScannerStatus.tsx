/**
 * @module ScannerStatus
 * @description Top-bar widget showing hardware scanner status (connect/disconnect).
 *   Pair with `useHardwareScanner` hook. Operator sees a green dot when a
 *   USB/Bluetooth scanner is attached, or can click to pair one.
 */

import { useHardwareScanner, type ScannerStatus as Status } from '../hooks/useHardwareScanner';
import { usePosI18n } from '../i18n/usePosI18n';

interface Props {
  onScan?: (barcode: string) => void;
  compact?: boolean;
}

const STATUS_COLORS: Record<Status, { bg: string; text: string }> = {
  idle:       { bg: '#94a3b8', text: 'Skaner ulanmagan' },
  connecting: { bg: '#f59e0b', text: 'Ulanmoqda...' },
  connected:  { bg: '#22c55e', text: 'Skaner ulangan' },
  error:      { bg: '#ef4444', text: 'Xato' },
};

export function ScannerStatus({ onScan, compact = false }: Props) {
  const { t } = usePosI18n();
  const { status, lastScan, errorMessage, connectHid, connectSerial, disconnect } =
    useHardwareScanner({ onScan: (e) => onScan?.(e.barcode) });

  const color = STATUS_COLORS[status];

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(0,0,0,0.04)', fontSize: 12,
        }}
        title={errorMessage ?? color.text}
      >
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: color.bg,
            boxShadow: status === 'connected' ? '0 0 6px ' + color.bg : 'none',
          }}
        />
        <span>{color.text}</span>
      </div>
    );
  }

  return (
    <div
      className="pos-card"
      style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 12, height: 12, borderRadius: '50%',
            background: color.bg,
            boxShadow: status === 'connected' ? `0 0 8px ${color.bg}` : 'none',
          }}
        />
        <span style={{ fontWeight: 600, fontSize: 13 }}>{color.text}</span>
      </div>

      {errorMessage && (
        <div style={{ fontSize: 11, color: '#ef4444' }}>{errorMessage}</div>
      )}

      {lastScan && (
        <div style={{ fontSize: 11, color: '#64748b' }}>
          {t('lastScanned') ?? 'Oxirgi scan'}:&nbsp;
          <span className="pos-mono" style={{ color: '#0f172a' }}>{lastScan.barcode}</span>
          &nbsp;({lastScan.source})
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {status !== 'connected' ? (
          <>
            <button
              className="pos-btn pos-btn-ghost"
              style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={() => void connectHid()}
            >
              🔌 USB (HID)
            </button>
            <button
              className="pos-btn pos-btn-ghost"
              style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={() => void connectSerial()}
            >
              📡 Serial / Bluetooth
            </button>
          </>
        ) : (
          <button
            className="pos-btn pos-btn-ghost"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => void disconnect()}
          >
            ✕ Uzish
          </button>
        )}
      </div>
    </div>
  );
}
