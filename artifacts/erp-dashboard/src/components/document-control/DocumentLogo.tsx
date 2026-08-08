/**
 * @module DocumentLogo
 * @description EuroPrint letterhead logo shown at the top-left of every document/spreadsheet
 * (owner requirement). Served from public/europrint-doc-logo.png via the app base path so it
 * renders on screen and in the browser print output. Falls back to a text wordmark if the image
 * fails to load, so a document is never left with a broken-image icon.
 */

import { useState } from 'react';

export function DocumentLogo({ height = 40 }: { height?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span style={{ height, fontSize: Math.round(height * 0.5) }} className="inline-flex items-center font-bold tracking-tight select-none">
        <span className="text-[var(--ep-blue)]">Euro</span><span className="text-[var(--ep-text)]">Print</span>
      </span>
    );
  }
  return (
    <img
      src={`${import.meta.env.BASE_URL}europrint-doc-logo.png`}
      alt="EuroPrint"
      style={{ height }}
      className="w-auto object-contain select-none"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
