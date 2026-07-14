/**
 * @module DocumentPaper
 * @description Google-Docs-style "paper" canvas (Variant B, visual only). A white A4-proportion
 * sheet (816×1056 @96dpi) centered on a light-gray page area with realistic margins + a subtle
 * drop-shadow, so the document feels like writing on paper rather than filling a form field.
 * Pure layout — no data/behavior change.
 */

import type { ReactNode } from 'react';
import { DocumentLogo } from './DocumentLogo';

// P1-5 page margins (px). Defaults preserve the original 72×64 layout.
export interface PageMargins { x: number; y: number }
export const DEFAULT_MARGINS: PageMargins = { x: 72, y: 64 };

// Presets + per-document persistence (localStorage — a per-browser layout preference, like zoom;
// no schema change). Shared by the editor (sets it) and the print view (reads it) so the PDF
// margins match what the author configured.
export const MARGIN_PRESETS: { key: string; label: string; m: PageMargins }[] = [
  { key: 'normal', label: 'Oddiy', m: { x: 72, y: 64 } },
  { key: 'narrow', label: 'Tor', m: { x: 36, y: 40 } },
  { key: 'wide', label: 'Keng', m: { x: 108, y: 80 } },
];
export function loadMargins(id: string | undefined): PageMargins {
  if (!id) return DEFAULT_MARGINS;
  try {
    const raw = localStorage.getItem(`doc-margins:${id}`);
    if (raw) { const p = JSON.parse(raw) as PageMargins; if (typeof p?.x === 'number' && typeof p?.y === 'number') return p; }
  } catch { /* ignore */ }
  return DEFAULT_MARGINS;
}
export function saveMargins(id: string | undefined, m: PageMargins): void {
  if (!id) return;
  try { localStorage.setItem(`doc-margins:${id}`, JSON.stringify(m)); } catch { /* ignore */ }
}

export function DocumentPaper({ children, margins = DEFAULT_MARGINS }: { children: ReactNode; margins?: PageMargins }) {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-800 py-6 px-3 min-h-[65vh] overflow-auto print:bg-white print:p-0">
      <div
        className="bg-white mx-auto w-full max-w-[816px] min-h-[1056px] rounded-sm shadow-[0_1px_3px_rgba(60,64,67,0.15),0_1px_2px_rgba(60,64,67,0.10)] print:shadow-none"
        style={{ paddingLeft: margins.x, paddingRight: margins.x, paddingTop: margins.y, paddingBottom: margins.y }}
      >
        {/* EuroPrint letterhead — top-left of every document (owner requirement). */}
        <div className="mb-5 flex justify-start"><DocumentLogo /></div>
        {children}
      </div>
    </div>
  );
}
