/**
 * @module DocumentWatermark
 * @description Document Control STEP 3.4 — reusable tiled watermark overlay (owner
 * decisions #12/#1). Wrap any document viewer; for `maxfiy` / `juda-maxfiy` tiers it renders
 * a non-removable, tiled diagonal overlay with the current viewer's name + timestamp
 * (+ user-id for juda-maxfiy). Deters screenshots/photos and marks provenance.
 *
 * - `pointer-events: none` → does not block interaction with the document underneath.
 * - Built as an SVG background-image → one element, tiles perfectly at any size.
 * - `print-color-adjust: exact` + not hidden in print → survives Ctrl+P of the page.
 * - `oddiy` (or unknown/absent tier) → no overlay (children rendered as-is).
 */

import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function DocumentWatermark({
  tier,
  children,
  className,
}: {
  tier?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const { user } = useAuth();
  const active = tier === 'maxfiy' || tier === 'juda-maxfiy';

  if (!active) return <div className={className}>{children}</div>;

  const now = new Date();
  const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const name = user?.fullName || user?.username || 'Foydalanuvchi';
  const label = tier === 'juda-maxfiy' ? `${name} • #${user?.id ?? '?'} • ${ts}` : `${name} • ${ts}`;

  // Denser tiling + slightly stronger ink for juda-maxfiy.
  const tileW = tier === 'juda-maxfiy' ? 280 : 340;
  const tileH = tier === 'juda-maxfiy' ? 150 : 200;
  const ink = tier === 'juda-maxfiy' ? 0.16 : 0.12;

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${tileW}' height='${tileH}'>` +
    `<text x='12' y='${tileH / 2}' transform='rotate(-28 ${tileW / 2} ${tileH / 2})' ` +
    `fill='rgba(90,90,90,${ink})' font-size='15' font-weight='600' font-family='Arial, sans-serif'>` +
    `${escapeXml(label)}</text></svg>`;
  const bg = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

  return (
    <div className={className} style={{ position: 'relative' }}>
      {children}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 40,
          backgroundImage: bg,
          backgroundRepeat: 'repeat',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      />
    </div>
  );
}
