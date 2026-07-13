/**
 * @module DocumentPaper
 * @description Google-Docs-style "paper" canvas (Variant B, visual only). A white A4-proportion
 * sheet (816×1056 @96dpi) centered on a light-gray page area with realistic margins + a subtle
 * drop-shadow, so the document feels like writing on paper rather than filling a form field.
 * Pure layout — no data/behavior change.
 */

import type { ReactNode } from 'react';
import { DocumentLogo } from './DocumentLogo';

export function DocumentPaper({ children }: { children: ReactNode }) {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-800 py-6 px-3 min-h-[65vh] overflow-auto">
      <div className="bg-white mx-auto w-full max-w-[816px] min-h-[1056px] rounded-sm shadow-[0_1px_3px_rgba(60,64,67,0.15),0_1px_2px_rgba(60,64,67,0.10)] px-[72px] py-[64px]">
        {/* EuroPrint letterhead — top-left of every document (owner requirement). */}
        <div className="mb-5 flex justify-start"><DocumentLogo /></div>
        {children}
      </div>
    </div>
  );
}
