/**
 * @module TransparencyPanel
 * @description Slides in from the right whenever AIsha posts a new response.
 * Renders every provenance source, each citation, and any camera snapshots
 * captured during the answer. Click-through links take the Director to the
 * underlying record (e.g. /iot/cameras/:id, /sd/orders/:id).
 */

import { useState } from 'react';
import { useAishaStore, type ProvenanceSourceUI, type CameraSnapshotUI } from '@/aisha/store';
import { useTranslation } from '@/lib/i18n';
import { AishaHudCorners } from './AishaHudCorners';
import { AishaRadialGauge } from './AishaRadialGauge';
import './aisha-immersive.css';

export function TransparencyPanel() {
  const lastResponse = useAishaStore((s) => s.lastResponse);
  const { t } = useTranslation('aisha');
  const [open, setOpen] = useState(true);

  if (!lastResponse) return null;
  const { provenance } = lastResponse;
  const sources = Array.isArray(provenance.sources) ? provenance.sources : [];
  const citations = Array.isArray(provenance.citations) ? provenance.citations : [];
  const snapshots = Array.isArray(provenance.cameraSnapshots) ? provenance.cameraSnapshots : [];

  return (
    <aside
      data-testid="aisha-transparency"
      className="aisha-glass"
      style={{
        position: 'fixed', top: 16, right: 360,
        width: open ? 320 : 36,
        maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
        padding: open ? 16 : 8, zIndex: 49,
        transition: 'width .2s ease',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <AishaHudCorners />
      <button
        onClick={() => setOpen(o => !o)}
        className="aisha-glass-muted"
        style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 14 }}
      >
        {open ? '▸' : '◂'}
      </button>
      {open && (
        <>
          <h3 className="aisha-glass-title" style={{ margin: '8px 0', fontSize: 14 }}>
            {t('transparency.title') as string}
          </h3>
          <div className="aisha-hud-scanline" style={{ marginBottom: 12 }} />
          <div data-testid="aisha-confidence" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <AishaRadialGauge value={provenance.confidence * 100} size={52} strokeWidth={4} />
            <span className="aisha-glass-muted" style={{ fontSize: 12 }}>
              {t('transparency.confidence') as string}
            </span>
          </div>
          <SectionTitle label={t('transparency.sources') as string} count={sources.length} />
          <ul style={{ marginTop: 4, padding: 0, listStyle: 'none' }}>
            {sources.map((s, i) => <SourceRow key={i} s={s} freshnessLabel={t(`transparency.freshness.${s.freshness}`) as string} />)}
          </ul>
          {snapshots.length > 0 && (
            <>
              <SectionTitle label={t('transparency.camera') as string} count={snapshots.length} />
              <CameraGrid snapshots={snapshots} />
            </>
          )}
          {citations.length > 0 && (
            <>
              <SectionTitle label={t('transparency.citations') as string} count={citations.length} />
              <ul style={{ marginTop: 4, padding: 0, listStyle: 'none' }}>
                {citations.map((c, i) => (
                  <li key={i} className="aisha-glass-divider" style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid' }}>
                    {c.url ? <a href={c.url} className="aisha-glass-accent">{c.label}</a> : <span className="aisha-glass-title">{c.label}</span>}
                    {c.snippet && <div className="aisha-glass-subtle" style={{ marginTop: 2 }}>{c.snippet}</div>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </aside>
  );
}

function SectionTitle({ label, count }: { label: string; count: number }) {
  return (
    <div className="aisha-glass-title" style={{ marginTop: 12, fontSize: 11, textTransform: 'uppercase' }}>
      {label} <span className="aisha-glass-subtle" style={{ fontWeight: 400 }}>({count})</span>
    </div>
  );
}

function SourceRow({ s, freshnessLabel }: { s: ProvenanceSourceUI; freshnessLabel: string }) {
  return (
    <li className="aisha-glass-divider" style={{ fontSize: 12, padding: '6px 0', borderBottom: '1px solid', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="aisha-glass-title" style={{ fontWeight: 500 }}>{s.identifier}</span>
        <span className="aisha-glass-muted">{s.latencyMs}ms</span>
      </div>
      <div className="aisha-glass-subtle">
        {s.type} · {freshnessLabel}{typeof s.rowCount === 'number' ? ` · ${s.rowCount} qator` : ''}
      </div>
    </li>
  );
}

function CameraGrid({ snapshots }: { snapshots: CameraSnapshotUI[] }) {
  return (
    <div data-testid="aisha-cameras" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
      {snapshots.map(c => (
        <a key={c.cameraId} href={`/iot/cameras/${c.cameraId}`} className="aisha-glass-title" style={{ textDecoration: 'none' }}>
          <img src={c.snapshotUrl} alt={c.cameraName} style={{ width: '100%', borderRadius: 8 }} />
          <div style={{ fontSize: 11, marginTop: 4 }}>{c.cameraName}</div>
        </a>
      ))}
    </div>
  );
}
