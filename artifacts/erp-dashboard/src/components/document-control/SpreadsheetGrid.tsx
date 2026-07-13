/**
 * @module SpreadsheetGrid
 * @description Custom lightweight spreadsheet grid (Jadval, Phase B-3). Clean white grid with
 * light gridlines (no "paper" metaphor — native spreadsheet UX), a formula bar, editable cells,
 * and client-side formulas (SUM/AVERAGE/COUNT/IF via lib/spreadsheet). Cells persist as a JSONB
 * map to erp_spreadsheets.cells. Cell-formatting toolbar (bold/borders/number-format) is B-4.
 */

import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Bold, AlignLeft, AlignCenter, AlignRight, PaintBucket, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { evalCell, numToCol, colToNum, formatDisplay, type Cells, type CellStyle } from '@/lib/spreadsheet';
import { tLabel } from '@/lib/i18n/tLabel';

const ROWS = 30;
const COLS = 12; // A..L

export function SpreadsheetGrid({
  cells,
  onChange,
  editable = true,
}: {
  cells: Cells;
  onChange?: (cells: Cells) => void;
  editable?: boolean;
}) {
  const [sel, setSel] = useState('A1');
  const [editing, setEditing] = useState<string | null>(null);
  const [buf, setBuf] = useState('');

  const raw = (ref: string) => { const c = cells[ref]; return c?.f ?? c?.v ?? ''; };

  const commit = (ref: string, val: string) => {
    if (!editable || !onChange) return;
    const next: Cells = { ...cells };
    const t = val.trim();
    if (t === '') delete next[ref];
    else if (t.startsWith('=')) next[ref] = { f: t };
    else next[ref] = { v: val };
    onChange(next);
  };

  const startEdit = (ref: string, initial?: string) => { if (!editable) return; setEditing(ref); setBuf(initial ?? raw(ref)); };
  const commitEdit = () => { if (editing) commit(editing, buf); setEditing(null); };

  const gridRef = useRef<HTMLDivElement>(null);
  const moveSel = (dc: number, dr: number) => {
    const m = /^([A-Z]+)([0-9]+)$/.exec(sel);
    if (!m) return;
    const c = Math.min(COLS, Math.max(1, colToNum(m[1]) + dc));
    const r = Math.min(ROWS, Math.max(1, +m[2] + dr));
    setSel(numToCol(c) + r);
  };
  // Excel-style keyboard on the selected cell: single click selects, then typing edits
  // immediately (no double-click needed); arrows move, F2 edits in place, Delete clears.
  const onGridKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (editing || !editable) return; // while editing, the cell <input> owns the keys
    const k = e.key;
    switch (k) {
      case 'ArrowUp': moveSel(0, -1); e.preventDefault(); return;
      case 'ArrowDown': case 'Enter': moveSel(0, 1); e.preventDefault(); return;
      case 'ArrowLeft': moveSel(-1, 0); e.preventDefault(); return;
      case 'ArrowRight': case 'Tab': moveSel(1, 0); e.preventDefault(); return;
      case 'F2': startEdit(sel); e.preventDefault(); return;
      case 'Delete': case 'Backspace': commit(sel, ''); e.preventDefault(); return;
      case 'Escape': return;
      default:
        if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { startEdit(sel, k); e.preventDefault(); }
    }
  };

  const setStyle = (patch: Partial<CellStyle>) => {
    if (!editable || !onChange) return;
    const cur = cells[sel] ?? {};
    onChange({ ...cells, [sel]: { ...cur, s: { ...(cur.s ?? {}), ...patch } } });
  };
  const selStyle = cells[sel]?.s ?? {};

  return (
    <div className="flex flex-col bg-white border border-[var(--ep-border)] rounded-lg overflow-hidden">
      {/* Cell-format toolbar */}
      {editable && (
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-[var(--ep-border)] bg-[var(--ep-surface)]">
          <button type="button" title={tLabel('documents.bold', 'Qalin')} onClick={() => setStyle({ b: !selStyle.b })}
            className={cn('w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--ep-bg)]', selStyle.b && 'bg-[var(--ep-blue)]/12 text-[var(--ep-blue)]')}><Bold className="w-3.5 h-3.5" /></button>
          <span className="w-px h-4 bg-[var(--ep-border)] mx-1" />
          {(['l', 'c', 'r'] as const).map((a) => (
            <button key={a} type="button" title={tLabel('documents.align' + a.toUpperCase(), a)} onClick={() => setStyle({ a })}
              className={cn('w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--ep-bg)]', selStyle.a === a && 'bg-[var(--ep-blue)]/12 text-[var(--ep-blue)]')}>
              {a === 'l' ? <AlignLeft className="w-3.5 h-3.5" /> : a === 'c' ? <AlignCenter className="w-3.5 h-3.5" /> : <AlignRight className="w-3.5 h-3.5" />}
            </button>
          ))}
          <span className="w-px h-4 bg-[var(--ep-border)] mx-1" />
          {/* Cell background fill (native picker) */}
          <label title={tLabel('documents.cellFill', "To'ldirish rangi")}
            className={cn('w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--ep-bg)] cursor-pointer relative', selStyle.bg && 'text-[var(--ep-blue)]')}>
            <PaintBucket className="w-3.5 h-3.5" />
            <input type="color" value={selStyle.bg ?? '#ffffff'} onChange={(e) => setStyle({ bg: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
          {selStyle.bg && (
            <button type="button" title={tLabel('documents.cellFillClear', "To'ldirishni tozalash")} onClick={() => setStyle({ bg: undefined })}
              className="text-[10px] px-1 h-7 rounded hover:bg-[var(--ep-bg)] text-[var(--ep-muted)]">✕</button>
          )}
          {/* Cell border toggle */}
          <button type="button" title={tLabel('documents.cellBorder', 'Chegara')} onClick={() => setStyle({ bd: !selStyle.bd })}
            className={cn('w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--ep-bg)]', selStyle.bd && 'bg-[var(--ep-blue)]/12 text-[var(--ep-blue)]')}><Square className="w-3.5 h-3.5" /></button>
          <span className="w-px h-4 bg-[var(--ep-border)] mx-1" />
          <select value={selStyle.fmt ?? 'num'} onChange={(e) => setStyle({ fmt: e.target.value as CellStyle['fmt'] })}
            title={tLabel('documents.numberFormat', 'Raqam formati')} className="h-7 text-xs rounded border border-[var(--ep-border)] bg-[var(--ep-surface)] px-1">
            <option value="num">{tLabel('documents.fmtPlain', 'Oddiy')}</option>
            <option value="money">{tLabel('documents.fmtMoney', 'Pul')}</option>
            <option value="pct">{tLabel('documents.fmtPct', 'Foiz')}</option>
          </select>
        </div>
      )}

      {/* Formula bar */}
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-[var(--ep-border)] bg-[var(--ep-surface)]">
        <span className="text-xs font-mono font-semibold text-[var(--ep-muted)] w-12 text-center shrink-0">{sel}</span>
        <span className="text-[var(--ep-border)]">|</span>
        <input
          value={editing === sel ? buf : raw(sel)}
          onChange={(e) => { setEditing(sel); setBuf(e.target.value); }}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') { commitEdit(); e.currentTarget.blur(); } }}
          disabled={!editable}
          placeholder="fx  (masalan: =SUM(A1:A5))"
          className="flex-1 text-sm bg-transparent outline-none font-mono"
        />
      </div>

      {/* Grid */}
      <div ref={gridRef} tabIndex={0} onKeyDown={onGridKeyDown} className="overflow-auto max-h-[62vh] outline-none">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-10 w-10 h-7 bg-[var(--ep-bg)] border border-[var(--ep-border)]" />
              {Array.from({ length: COLS }, (_, c) => (
                <th key={c} className="sticky top-0 z-[5] min-w-[96px] h-7 bg-[var(--ep-bg)] border border-[var(--ep-border)] text-[11px] font-semibold text-[var(--ep-muted)]">
                  {numToCol(c + 1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, r) => (
              <tr key={r}>
                <td className="sticky left-0 z-[5] w-10 h-7 bg-[var(--ep-bg)] border border-[var(--ep-border)] text-center text-[11px] font-semibold text-[var(--ep-muted)]">{r + 1}</td>
                {Array.from({ length: COLS }, (_, c) => {
                  const ref = numToCol(c + 1) + (r + 1);
                  const isSel = sel === ref;
                  const isEditing = editing === ref;
                  const style = cells[ref]?.s;
                  const rawDisplay = evalCell(ref, cells);
                  const display = formatDisplay(rawDisplay, style?.fmt);
                  const isNum = rawDisplay !== '' && !rawDisplay.startsWith('#') && !Number.isNaN(Number(rawDisplay));
                  const align = style?.a ?? (isNum ? 'r' : 'l');
                  const isErr = rawDisplay === '#CYCLE' || rawDisplay === '#ERR';
                  return (
                    <td
                      key={c}
                      onClick={() => { setSel(ref); gridRef.current?.focus(); }}
                      onDoubleClick={() => startEdit(ref)}
                      style={style?.bg ? { backgroundColor: style.bg } : undefined}
                      className={cn(
                        'min-w-[96px] h-7 px-1.5 cursor-cell align-middle',
                        style?.bd ? 'border-2 border-[var(--ep-text)]' : 'border border-[var(--ep-border)]',
                        isSel && 'ring-2 ring-[var(--ep-blue)] ring-inset',
                        align === 'r' ? 'text-right tabular-nums' : align === 'c' ? 'text-center' : 'text-left',
                      )}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={buf}
                          onChange={(e) => setBuf(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { commitEdit(); moveSel(0, 1); gridRef.current?.focus(); e.preventDefault(); }
                            else if (e.key === 'Tab') { commitEdit(); moveSel(1, 0); gridRef.current?.focus(); e.preventDefault(); }
                            else if (e.key === 'Escape') { setEditing(null); gridRef.current?.focus(); }
                          }}
                          className="w-full h-full outline-none bg-transparent text-sm font-mono"
                        />
                      ) : (
                        <span className={cn(style?.b && 'font-bold', isErr ? 'text-[var(--ep-red)]' : 'text-[var(--ep-text)]')}>{display}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
