/**
 * @module FindBar
 * @description P1-3 find & replace UI for the erkin-hujjat editor. Drives the SearchReplace
 * TipTap extension: typing filters + highlights matches, ↑/↓ navigate, and replace / replace-all
 * edit the doc (undoable). Live "n / total" counter reads plugin state via searchStatus and
 * re-renders on editor transactions. Opened with Ctrl+F, closed with Esc / ✕ (clears highlights).
 */

import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { ChevronUp, ChevronDown, X, CaseSensitive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tLabel } from '@/lib/i18n/tLabel';
import {
  searchStatus, setSearchTerm, setSearchCaseSensitive, findNext, findPrev, replaceCurrent, replaceAll, clearSearch,
} from './SearchReplaceExtension';

export function FindBar({ editor, open, onClose }: { editor: Editor; open: boolean; onClose: () => void }) {
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [, force] = useState(0);
  const findRef = useRef<HTMLInputElement>(null);

  // Re-render on editor transactions so the match counter stays live.
  useEffect(() => {
    const cb = () => force((n) => n + 1);
    editor.on('transaction', cb);
    return () => { editor.off('transaction', cb); };
  }, [editor]);

  useEffect(() => {
    if (open) { findRef.current?.focus(); findRef.current?.select(); }
    else { clearSearch(editor); }
  }, [open, editor]);

  if (!open) return null;
  const { count, index } = searchStatus(editor);

  const applyFind = (term: string) => { setFind(term); setSearchTerm(editor, term); };
  const toggleCase = () => { const on = !caseSensitive; setCaseSensitive(on); setSearchCaseSensitive(editor, on); };
  const close = () => { clearSearch(editor); onClose(); };

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-1.5 border-b border-[var(--ep-border)] bg-[var(--ep-surface)] px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-1">
        <input
          ref={findRef}
          value={find}
          onChange={(e) => applyFind(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? findPrev(editor) : findNext(editor); }
            if (e.key === 'Escape') { e.preventDefault(); close(); }
          }}
          placeholder={tLabel('documents.findPlaceholder', 'Qidirish...')}
          className="h-8 w-44 text-sm rounded-lg border border-[var(--ep-border)] bg-[var(--ep-surface)] px-2 outline-none focus:border-[var(--ep-blue)]"
        />
        <span className="text-[11px] text-[var(--ep-muted)] min-w-14 text-center tabular-nums">
          {count ? `${index + 1} / ${count}` : tLabel('documents.noMatch', "topilmadi")}
        </span>
        <button type="button" title={tLabel('documents.findPrev', 'Oldingi')} onClick={() => findPrev(editor)} disabled={!count}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--ep-bg)] disabled:opacity-40"><ChevronUp className="w-4 h-4" /></button>
        <button type="button" title={tLabel('documents.findNext', 'Keyingi')} onClick={() => findNext(editor)} disabled={!count}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--ep-bg)] disabled:opacity-40"><ChevronDown className="w-4 h-4" /></button>
        <button type="button" title={tLabel('documents.caseSensitive', 'Katta/kichik harf')} onClick={toggleCase}
          className={cn('w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--ep-bg)]', caseSensitive && 'bg-[var(--ep-blue)]/12 text-[var(--ep-blue)]')}><CaseSensitive className="w-4 h-4" /></button>
      </div>
      <span className="w-px h-5 bg-[var(--ep-border)] mx-0.5" />
      <div className="flex items-center gap-1">
        <input
          value={replace}
          onChange={(e) => setReplace(e.target.value)}
          placeholder={tLabel('documents.replacePlaceholder', "Almashtirish...")}
          className="h-8 w-44 text-sm rounded-lg border border-[var(--ep-border)] bg-[var(--ep-surface)] px-2 outline-none focus:border-[var(--ep-blue)]"
        />
        <button type="button" onClick={() => replaceCurrent(editor, replace)} disabled={!count}
          className="h-8 px-2 rounded text-[11px] font-medium hover:bg-[var(--ep-bg)] disabled:opacity-40">{tLabel('documents.replaceOne', 'Almashtir')}</button>
        <button type="button" onClick={() => replaceAll(editor, replace)} disabled={!count}
          className="h-8 px-2 rounded text-[11px] font-medium hover:bg-[var(--ep-bg)] disabled:opacity-40">{tLabel('documents.replaceAll', 'Hammasini')}</button>
      </div>
      <button type="button" title={tLabel('documents.close', 'Yopish')} onClick={close}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--ep-bg)] ml-auto"><X className="w-4 h-4" /></button>
    </div>
  );
}
