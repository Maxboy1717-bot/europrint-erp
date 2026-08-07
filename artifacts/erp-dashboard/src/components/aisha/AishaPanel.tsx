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
import { AishaHudCorners } from './AishaHudCorners';
import { useWakeWord } from '@/aisha/hooks/use-wake-word';
import './aisha-immersive.css';

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
      className="aisha-glass"
      style={{
        position: 'fixed', top: 16, right: 16,
        width: collapsed ? 80 : 320,
        padding: 16, zIndex: 50,
        transition: 'width .2s ease',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <AishaHudCorners />
      <header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <AishaOrb status={status} size={48} />
        {!collapsed && (
          <div style={{ flex: 1 }}>
            <div className="aisha-glass-title">{t('title')}</div>
            <div data-testid="aisha-status" className="aisha-glass-muted" style={{ fontSize: 12 }}>
              {t(`status.${status}`) as string}
            </div>
          </div>
        )}
        <button
          aria-label={collapsed ? (t('panel.expand') as string) : (t('panel.collapse') as string)}
          onClick={() => setCollapsed(c => !c)}
          className="aisha-glass-muted"
          style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 18 }}
        >
          {collapsed ? '▸' : '▾'}
        </button>
      </header>
      <div className="aisha-hud-scanline" style={{ marginTop: 10 }} />

      {!collapsed && (
        <>
          <div className="aisha-glass-title" style={{ marginTop: 12, fontSize: 12 }}>
            {t('panel.history')}
          </div>
          <ul data-testid="aisha-history" style={{ marginTop: 8, padding: 0, listStyle: 'none', maxHeight: 180, overflowY: 'auto' }}>
            {safeHistory.length === 0
              ? <li className="aisha-glass-subtle" style={{ fontSize: 12 }}>{t('panel.noHistory') as string}</li>
              : safeHistory.map(h => (
                  <li key={h.id} className="aisha-glass-divider aisha-glass-title" style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid', fontWeight: 400 }}>
                    {h.transcript}
                  </li>
                ))}
          </ul>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button
              data-testid="aisha-mute"
              onClick={toggleMute}
              className={muted ? 'aisha-glass-btn aisha-glass-btn--danger' : 'aisha-glass-btn'}
              style={{ flex: 1, padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
            >
              {muted ? (t('panel.unmute') as string) : (t('panel.mute') as string)}
            </button>
          </div>
          <div className="aisha-glass-subtle" style={{ marginTop: 8, fontSize: 11 }}>
            {t('shortcut.muteHint') as string} · {t('shortcut.wakeHint') as string}
          </div>
        </>
      )}
    </aside>
  );
}
