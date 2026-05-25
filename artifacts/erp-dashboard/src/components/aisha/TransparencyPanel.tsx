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
      style={{
        position: 'fixed', top: 16, right: 360,
        width: open ? 320 : 36,
        maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
        background: 'white', borderRadius: 16,
        boxShadow: '0 8px 32px rgba(15, 23, 42, .08)',
        border: '1px solid rgba(99,102,241,.12)',
        padding: open ? 16 : 8, zIndex: 49,
        transition: 'width .2s ease',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 14, color: '#64748b' }}
      >
        {open ? '▸' : '◂'}
      </button>
      {open && (
        <>
          <h3 style={{ margin: '8px 0', fontSize: 14, color: '#1e293b', fontWeight: 600 }}>
            {t('transparency.title') as string}
          </h3>
          <div data-testid="aisha-confidence" style={{ marginBottom: 12, fontSize: 12, color: '#64748b' }}>
            {t('transparency.confidence') as string}: {Math.round(provenance.confidence * 100)}%
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
                  <li key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                    {c.url ? <a href={c.url} style={{ color: '#4f46e5' }}>{c.label}</a> : c.label}
                    {c.snippet && <div style={{ color: '#94a3b8', marginTop: 2 }}>{c.snippet}</div>}
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
    <div style={{ marginTop: 12, fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
      {label} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({count})</span>
    </div>
  );
}

function SourceRow({ s, freshnessLabel }: { s: ProvenanceSourceUI; freshnessLabel: string }) {
  return (
    <li style={{ fontSize: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 500, color: '#1e293b' }}>{s.identifier}</span>
        <span style={{ color: '#64748b' }}>{s.latencyMs}ms</span>
      </div>
      <div style={{ color: '#94a3b8' }}>
        {s.type} · {freshnessLabel}{typeof s.rowCount === 'number' ? ` · ${s.rowCount} qator` : ''}
      </div>
    </li>
  );
}

function CameraGrid({ snapshots }: { snapshots: CameraSnapshotUI[] }) {
  return (
    <div data-testid="aisha-cameras" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
      {snapshots.map(c => (
        <a key={c.cameraId} href={`/iot/cameras/${c.cameraId}`} style={{ textDecoration: 'none', color: '#1e293b' }}>
          <img src={c.snapshotUrl} alt={c.cameraName} style={{ width: '100%', borderRadius: 8 }} />
          <div style={{ fontSize: 11, marginTop: 4 }}>{c.cameraName}</div>
        </a>
      ))}
    </div>
  );
}
