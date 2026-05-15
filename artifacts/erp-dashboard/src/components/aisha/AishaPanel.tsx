/**
 * @module AishaPanel
 * @description Collapsible top-right panel mounted inside DirectorDashboard.
 * Composes the orb, status text, command history, and mute toggle. Wake
 * word and mic capture live in hooks (use-wake-word, use-microphone)
 * so this file stays presentation-only.
 */

import { useEffect, useState } from 'react';
import { useAishaStore } from '@/aisha/store';
import { useTranslation } from '@/lib/i18n';
import { AishaOrb } from './AishaOrb';
import { useWakeWord } from '@/aisha/hooks/use-wake-word';

interface Props {
  isDirector: boolean;
  accessKey?: string | null;
  ppnUrl?:    string;
  sensitivity?: number;
}

export function AishaPanel({ isDirector, accessKey = null, ppnUrl = '/aisha/assets/aisha.ppn', sensitivity = 0.7 }: Props) {
  const { t } = useTranslation('aisha');
  const status = useAishaStore((s) => s.status);
  const muted = useAishaStore((s) => s.muted);
  const history = useAishaStore((s) => s.history);
  const setStatus = useAishaStore((s) => s.setStatus);
  const toggleMute = useAishaStore((s) => s.toggleMute);
  const [collapsed, setCollapsed] = useState(false);

  useWakeWord({
    enabled: isDirector && !muted,
    accessKey, ppnUrl, sensitivity,
    onWake: () => setStatus('listening'),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleMute]);

  if (!isDirector) return null;

  const safeHistory = Array.isArray(history) ? history : [];

  return (
    <aside
      data-testid="aisha-panel"
      style={{
        position: 'fixed', top: 16, right: 16,
        width: collapsed ? 80 : 320,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(15, 23, 42, .08)',
        border: '1px solid rgba(99,102,241,.12)',
        padding: 16, zIndex: 50,
        transition: 'width .2s ease',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <AishaOrb status={status} size={48} />
        {!collapsed && (
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>{t('title')}</div>
            <div data-testid="aisha-status" style={{ fontSize: 12, color: '#64748b' }}>
              {t(`status.${status}`) as string}
            </div>
          </div>
        )}
        <button
          aria-label={collapsed ? (t('panel.expand') as string) : (t('panel.collapse') as string)}
          onClick={() => setCollapsed(c => !c)}
          style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 18, color: '#64748b' }}
        >
          {collapsed ? '▸' : '▾'}
        </button>
      </header>

      {!collapsed && (
        <>
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: '#475569' }}>
            {t('panel.history')}
          </div>
          <ul data-testid="aisha-history" style={{ marginTop: 8, padding: 0, listStyle: 'none', maxHeight: 180, overflowY: 'auto' }}>
            {safeHistory.length === 0
              ? <li style={{ fontSize: 12, color: '#94a3b8' }}>{t('panel.noHistory') as string}</li>
              : safeHistory.map(h => (
                  <li key={h.id} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}>
                    {h.transcript}
                  </li>
                ))}
          </ul>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button
              data-testid="aisha-mute"
              onClick={toggleMute}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                background: muted ? '#fee2e2' : '#eef2ff',
                color: muted ? '#b91c1c' : '#4338ca',
                border: 0, fontSize: 13, fontWeight: 500,
              }}
            >
              {muted ? (t('panel.unmute') as string) : (t('panel.mute') as string)}
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
            {t('shortcut.muteHint') as string} · {t('shortcut.wakeHint') as string}
          </div>
        </>
      )}
    </aside>
  );
}
