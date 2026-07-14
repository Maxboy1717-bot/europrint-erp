/**
 * @module SpreadsheetGrid
 * @description Custom lightweight spreadsheet grid (Jadval). Clean white grid with light
 * gridlines (native spreadsheet UX), a formula bar, editable cells, and client-side formulas
 * (lib/spreadsheet). Cells persist as a JSONB map to erp_spreadsheets.cells. Supports: cell
 * formatting (bold/align/number-format/fill/border), Excel-style single-click-then-type entry,
 * range selection + select-all (format/clear a whole rectangle), a formula (fx) helper, and
 * per-column filtering.
 */

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Bold, AlignLeft, AlignCenter, AlignRight, PaintBucket, Square, Filter, Grid3x3, Plus, Copy, Undo2, Redo2, ArrowDownToLine, ArrowRightToLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { evalCell, numToCol, colToNum, formatDisplay, type Cells, type CellStyle } from '@/lib/spreadsheet';
import { fillCell } from '@/lib/spreadsheetFill';
import { tLabel } from '@/lib/i18n/tLabel';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_ROWS = 30;
const DEFAULT_COLS = 12; // A..L
const MAX_ROWS = 500;
const MAX_COLS = 60;

// Formula helper catalog — name + a copy-of-syntax hint (so non-technical users don't need to
// memorise the exact form). Data array (no translatable prose) → clicking inserts "=NAME(".
const FUNCTIONS: { name: string; hint: string }[] = [
  { name: 'SUM', hint: '=SUM(A1:A5)' },
  { name: 'AVERAGE', hint: '=AVERAGE(A1:A5)' },
  { name: 'MIN', hint: '=MIN(A1:A5)' },
  { name: 'MAX', hint: '=MAX(A1:A5)' },
  { name: 'COUNT', hint: '=COUNT(A1:A5)' },
  { name: 'COUNTA', hint: '=COUNTA(A1:A5)' },
  { name: 'PRODUCT', hint: '=PRODUCT(A1:A5)' },
  { name: 'MEDIAN', hint: '=MEDIAN(A1:A5)' },
  { name: 'SUMIF', hint: '=SUMIF(A1:A5,">10")' },
  { name: 'COUNTIF', hint: '=COUNTIF(A1:A5,">10")' },
  { name: 'AVERAGEIF', hint: '=AVERAGEIF(A1:A5,">10")' },
  { name: 'ROUND', hint: '=ROUND(A1,2)' },
  { name: 'ROUNDUP', hint: '=ROUNDUP(A1,0)' },
  { name: 'ROUNDDOWN', hint: '=ROUNDDOWN(A1,0)' },
  { name: 'ABS', hint: '=ABS(A1)' },
  { name: 'SQRT', hint: '=SQRT(A1)' },
  { name: 'POWER', hint: '=POWER(A1,2)' },
  { name: 'MOD', hint: '=MOD(A1,3)' },
  { name: 'INT', hint: '=INT(A1)' },
  { name: 'SIGN', hint: '=SIGN(A1)' },
  { name: 'IF', hint: '=IF(A1>10,x,y)' },
  { name: 'AND', hint: '=AND(A1>1,B1>1)' },
  { name: 'OR', hint: '=OR(A1>1,B1>1)' },
  { name: 'NOT', hint: '=NOT(A1>1)' },
  { name: 'CONCATENATE', hint: '=CONCATENATE(A1," ",B1)' },
  { name: 'LEFT', hint: '=LEFT(A1,3)' },
  { name: 'RIGHT', hint: '=RIGHT(A1,3)' },
  { name: 'MID', hint: '=MID(A1,2,3)' },
  { name: 'LEN', hint: '=LEN(A1)' },
  { name: 'UPPER', hint: '=UPPER(A1)' },
  { name: 'LOWER', hint: '=LOWER(A1)' },
  { name: 'TRIM', hint: '=TRIM(A1)' },
  { name: 'VLOOKUP', hint: '=VLOOKUP(A1,B1:C9,2)' },
  { name: 'TODAY', hint: '=TODAY()' },
  { name: 'NOW', hint: '=NOW()' },
];

const parseRef = (ref: string): [number, number] | null => {
  const m = /^([A-Z]+)([0-9]+)$/.exec(ref);
  return m ? [colToNum(m[1]), +m[2]] : null;
};

export function SpreadsheetGrid({
  cells,
  onChange,
  editable = true,
  onCopy,
}: {
  cells: Cells;
  onChange?: (cells: Cells) => void;
  editable?: boolean;
  /** Fired after a successful clipboard copy (STEP 3.3 access logging). Best-effort. */
  onCopy?: () => void;
}) {
  const [sel, setSel] = useState('A1');       // active cell (range focus)
  const [anchor, setAnchor] = useState('A1'); // range anchor
  const [editing, setEditing] = useState<string | null>(null);
  const [buf, setBuf] = useState('');
  const [fxOpen, setFxOpen] = useState(false);
  const [filterOn, setFilterOn] = useState(false);
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Undo/redo history (Ctrl+Z / Ctrl+Y). Every edit snapshots the PREVIOUS cells; applyChange is
  // the single write path so undo can walk back through commits, clears, pastes and formatting.
  const undoStack = useRef<Cells[]>([]);
  const redoStack = useRef<Cells[]>([]);
  const [, bumpHist] = useState(0);
  const applyChange = (next: Cells) => {
    if (!onChange) return;
    undoStack.current.push(cells);
    if (undoStack.current.length > 200) undoStack.current.shift();
    redoStack.current = [];
    onChange(next);
    bumpHist((t) => t + 1);
  };
  const undo = () => {
    if (!onChange) return;
    const prev = undoStack.current.pop();
    if (prev === undefined) return;
    redoStack.current.push(cells);
    onChange(prev);
    bumpHist((t) => t + 1);
  };
  const redo = () => {
    if (!onChange) return;
    const next = redoStack.current.pop();
    if (next === undefined) return;
    undoStack.current.push(cells);
    onChange(next);
    bumpHist((t) => t + 1);
  };

  // Grow (never shrink) so every populated cell is visible when a sheet loads.
  useEffect(() => {
    let mc = 0, mr = 0;
    for (const k of Object.keys(cells)) { const m = /^([A-Z]+)([0-9]+)$/.exec(k); if (m) { mc = Math.max(mc, colToNum(m[1])); mr = Math.max(mr, +m[2]); } }
    setCols((c) => Math.min(MAX_COLS, Math.max(c, mc)));
    setRows((r) => Math.min(MAX_ROWS, Math.max(r, mr)));
  }, [cells]);

  const raw = (ref: string) => { const c = cells[ref]; return c?.f ?? c?.v ?? ''; };
  const LAST = numToCol(cols) + rows;

  // All refs inside the anchor→sel rectangle (single cell when they are equal).
  const rectRefs = (): string[] => {
    const a = parseRef(anchor), b = parseRef(sel);
    if (!a || !b) return [sel];
    const out: string[] = [];
    for (let c = Math.min(a[0], b[0]); c <= Math.max(a[0], b[0]); c++)
      for (let r = Math.min(a[1], b[1]); r <= Math.max(a[1], b[1]); r++) out.push(numToCol(c) + r);
    return out;
  };
  const inRange = (ref: string): boolean => {
    const a = parseRef(anchor), b = parseRef(sel), p = parseRef(ref);
    if (!a || !b || !p) return false;
    return p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0])
      && p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1]);
  };
  const selectAll = () => { setAnchor('A1'); setSel(LAST); gridRef.current?.focus(); };
  const pick = (ref: string, extend: boolean) => { setSel(ref); if (!extend) setAnchor(ref); gridRef.current?.focus(); };

  const commit = (ref: string, val: string) => {
    if (!editable || !onChange) return;
    const next: Cells = { ...cells };
    const t = val.trim();
    if (t === '') delete next[ref];
    else if (t.startsWith('=')) next[ref] = { f: t };
    else next[ref] = { v: val };
    applyChange(next);
  };
  const clearRange = () => {
    if (!editable || !onChange) return;
    const next: Cells = { ...cells };
    for (const ref of rectRefs()) delete next[ref];
    applyChange(next);
  };

  // Bounds of the current selection rectangle (single cell when anchor===sel).
  const rectBounds = (): [number, number, number, number] | null => {
    const a = parseRef(anchor), b = parseRef(sel);
    if (!a || !b) return null;
    return [Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  };

  // Copy the selected rectangle to the clipboard as TSV (tab = column, newline = row),
  // using each cell's DISPLAYED value (formulas evaluated) — pastes cleanly into Excel/Sheets
  // and back into this grid. Ctrl/Cmd+C when a range is selected (Excel parity).
  const copySelection = async () => {
    const bnds = rectBounds();
    if (!bnds) return;
    const [c0, c1, r0, r1] = bnds;
    const lines: string[] = [];
    for (let r = r0; r <= r1; r++) {
      const row: string[] = [];
      for (let c = c0; c <= c1; c++) {
        const ref = numToCol(c) + r;
        row.push(formatDisplay(evalCell(ref, cells), cells[ref]?.s?.fmt));
      }
      lines.push(row.join('\t'));
    }
    const tsv = lines.join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
      onCopy?.();
      const count = (c1 - c0 + 1) * (r1 - r0 + 1);
      toast({ title: tLabel('documents.copied', 'Nusxalandi'), description: `${count} ${tLabel('documents.cellsUnit', 'katak')}` });
    } catch {
      toast({ title: tLabel('common.error', 'Xatolik'), description: tLabel('documents.copyFailed', 'Nusxalab bo\'lmadi'), variant: 'destructive' });
    }
  };

  // Paste TSV/plain text from the clipboard starting at the active cell. Grid grows to fit
  // (via the size effect). Values starting with '=' become formulas.
  const pasteSelection = async () => {
    if (!editable || !onChange) return;
    let text = '';
    try { text = await navigator.clipboard.readText(); } catch { return; }
    if (!text) return;
    const start = parseRef(sel);
    if (!start) return;
    const next: Cells = { ...cells };
    text.replace(/\r/g, '').replace(/\n$/, '').split('\n').forEach((line, ri) => {
      line.split('\t').forEach((val, ci) => {
        const c = start[0] + ci, r = start[1] + ri;
        if (c > MAX_COLS || r > MAX_ROWS) return;
        const ref = numToCol(c) + r;
        const t = val.trim();
        const cur = next[ref] ?? {};
        if (t === '') delete next[ref];
        else if (t.startsWith('=')) next[ref] = { ...cur, f: t, v: undefined };
        else next[ref] = { ...cur, v: val, f: undefined };
      });
    });
    applyChange(next);
    toast({ title: tLabel('documents.pasted', 'Joylandi') });
  };

  const cutSelection = async () => { await copySelection(); clearRange(); };

  // Fill down (Ctrl+D) / right (Ctrl+R): every cell in the selection is filled FROM the top row /
  // left column of the selection, offsetting relative formula refs ($-locked ones stay fixed).
  const fillDown = () => {
    const b = rectBounds(); if (!b || !editable || !onChange) return;
    const [c0, c1, r0, r1] = b;
    if (r1 === r0) return;
    const next: Cells = { ...cells };
    for (let c = c0; c <= c1; c++) {
      const src = cells[numToCol(c) + r0];
      for (let r = r0 + 1; r <= r1; r++) {
        const ref = numToCol(c) + r;
        const filled = fillCell(src, 0, r - r0);
        if (filled) next[ref] = filled; else delete next[ref];
      }
    }
    applyChange(next);
  };
  const fillRight = () => {
    const b = rectBounds(); if (!b || !editable || !onChange) return;
    const [c0, c1, r0, r1] = b;
    if (c1 === c0) return;
    const next: Cells = { ...cells };
    for (let r = r0; r <= r1; r++) {
      const src = cells[numToCol(c0) + r];
      for (let c = c0 + 1; c <= c1; c++) {
        const ref = numToCol(c) + r;
        const filled = fillCell(src, c - c0, 0);
        if (filled) next[ref] = filled; else delete next[ref];
      }
    }
    applyChange(next);
  };

  const startEdit = (ref: string, initial?: string) => { if (!editable) return; setEditing(ref); setBuf(initial ?? raw(ref)); };
  const commitEdit = () => { if (editing) commit(editing, buf); setEditing(null); };

  const moveSel = (dc: number, dr: number, extend = false) => {
    const m = parseRef(sel);
    if (!m) return;
    const c = Math.min(cols, Math.max(1, m[0] + dc));
    const r = Math.min(rows, Math.max(1, m[1] + dr));
    const ref = numToCol(c) + r;
    setSel(ref);
    if (!extend) setAnchor(ref);
  };
  // Excel-style keyboard: single click selects, typing edits immediately (no double-click);
  // arrows move, Shift+arrows extend the range, Ctrl+A selects all, F2 edits, Delete clears.
  const onGridKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (editing) return; // while editing, the cell <input> owns the keys
    const k = e.key;
    const mod = e.ctrlKey || e.metaKey;
    // Clipboard: copy/select-all work even in read-only; cut/paste no-op unless editable.
    if (mod && (k === 'c' || k === 'C')) { void copySelection(); e.preventDefault(); return; }
    if (mod && (k === 'x' || k === 'X')) { void cutSelection(); e.preventDefault(); return; }
    if (mod && (k === 'v' || k === 'V')) { void pasteSelection(); e.preventDefault(); return; }
    if (mod && (k === 'a' || k === 'A')) { selectAll(); e.preventDefault(); return; }
    if (!editable) return;
    // Undo / redo (Ctrl+Z, Ctrl+Y or Ctrl+Shift+Z).
    if (mod && (k === 'z' || k === 'Z') && !e.shiftKey) { undo(); e.preventDefault(); return; }
    if (mod && ((k === 'y' || k === 'Y') || ((k === 'z' || k === 'Z') && e.shiftKey))) { redo(); e.preventDefault(); return; }
    // Fill down / right (Excel Ctrl+D / Ctrl+R) — preventDefault also stops browser reload/bookmark.
    if (mod && (k === 'd' || k === 'D')) { fillDown(); e.preventDefault(); return; }
    if (mod && (k === 'r' || k === 'R')) { fillRight(); e.preventDefault(); return; }
    switch (k) {
      case 'ArrowUp': moveSel(0, -1, e.shiftKey); e.preventDefault(); return;
      case 'ArrowDown': case 'Enter': moveSel(0, 1, e.shiftKey && k !== 'Enter'); e.preventDefault(); return;
      case 'ArrowLeft': moveSel(-1, 0, e.shiftKey); e.preventDefault(); return;
      case 'ArrowRight': case 'Tab': moveSel(1, 0, e.shiftKey && k !== 'Tab'); e.preventDefault(); return;
      case 'F2': startEdit(sel); e.preventDefault(); return;
      case 'Delete': case 'Backspace': clearRange(); e.preventDefault(); return;
      case 'Escape': return;
      default:
        if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { startEdit(sel, k); e.preventDefault(); }
    }
  };

  // Formatting applies to the WHOLE selected range (single cell when collapsed).
  const setStyle = (patch: Partial<CellStyle>) => {
    if (!editable || !onChange) return;
    const next: Cells = { ...cells };
    for (const ref of rectRefs()) {
      const cur = next[ref] ?? {};
      next[ref] = { ...cur, s: { ...(cur.s ?? {}), ...patch } };
    }
    applyChange(next);
  };
  const selStyle = cells[sel]?.s ?? {};

  const insertFn = (name: string) => { startEdit(sel, `=${name}(`); setFxOpen(false); };

  // Formula-bar label: single cell (A1) or, when a range is selected, "A1:L30 (count)" — visible
  // proof that a selection (incl. select-all) took effect.
  const rangeLabel = (() => {
    const a = parseRef(anchor), b = parseRef(sel);
    if (!a || !b || (a[0] === b[0] && a[1] === b[1])) return sel;
    const tl = numToCol(Math.min(a[0], b[0])) + Math.min(a[1], b[1]);
    const br = numToCol(Math.max(a[0], b[0])) + Math.max(a[1], b[1]);
    const count = (Math.abs(a[0] - b[0]) + 1) * (Math.abs(a[1] - b[1]) + 1);
    return `${tl}:${br} (${count})`;
  })();

  // Column filtering: a row is visible if, for every column with filter text, that column's
  // displayed value contains the text (case-insensitive, AND across columns).
  const activeFilters = Object.entries(filters).filter(([, v]) => v.trim() !== '');
  const rowVisible = (r: number): boolean => activeFilters.every(([c, v]) => {
    const ref = numToCol(+c + 1) + (r + 1);
    const disp = formatDisplay(evalCell(ref, cells), cells[ref]?.s?.fmt).toLowerCase();
    return disp.includes(v.trim().toLowerCase());
  });
  const visibleRows = Array.from({ length: rows }, (_, r) => r).filter((r) => !filterOn || rowVisible(r));

  return (
    <div className="flex flex-col bg-white border border-[var(--ep-border)] rounded-lg overflow-hidden">
      {/* Cell-format toolbar */}
      {editable && (
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-[var(--ep-border)] bg-[var(--ep-surface)]">
          {/* Undo / redo (also Ctrl+Z / Ctrl+Y) */}
          <button type="button" title={tLabel('documents.undo', 'Orqaga (Ctrl+Z)')} onClick={undo} disabled={undoStack.current.length === 0}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--ep-bg)] disabled:opacity-40"><Undo2 className="w-3.5 h-3.5" /></button>
          <button type="button" title={tLabel('documents.redo', 'Oldinga (Ctrl+Y)')} onClick={redo} disabled={redoStack.current.length === 0}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--ep-bg)] disabled:opacity-40"><Redo2 className="w-3.5 h-3.5" /></button>
          <span className="w-px h-4 bg-[var(--ep-border)] mx-1" />
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
          <span className="w-px h-4 bg-[var(--ep-border)] mx-1" />
          {/* Formula (fx) helper */}
          <div className="relative">
            <button type="button" title={tLabel('documents.insertFormula', "Formula qo'shish")} onClick={() => setFxOpen((v) => !v)}
              className={cn('h-7 px-2 rounded hover:bg-[var(--ep-bg)] text-xs font-semibold italic', fxOpen && 'bg-[var(--ep-blue)]/12 text-[var(--ep-blue)]')}>fx</button>
            {fxOpen && (
              <div className="absolute z-30 mt-1 left-0 w-60 max-h-64 overflow-auto rounded-lg border border-[var(--ep-border)] bg-[var(--ep-surface)] shadow-lg py-1">
                {FUNCTIONS.map((f) => (
                  <button key={f.name} type="button" onClick={() => insertFn(f.name)}
                    className="w-full text-left px-3 py-1.5 hover:bg-[var(--ep-bg)] flex flex-col">
                    <span className="text-xs font-semibold text-[var(--ep-text)]">{f.name}</span>
                    <span className="text-[11px] font-mono text-[var(--ep-muted)]">{f.hint}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Select-all (whole sheet) — labelled so it is obvious */}
          <button type="button" title={tLabel('documents.selectAll', 'Hammasini belgilash')} onClick={selectAll}
            className="inline-flex items-center gap-1 h-7 px-2 rounded hover:bg-[var(--ep-bg)] text-xs font-medium text-[var(--ep-text)]">
            <Grid3x3 className="w-3.5 h-3.5" />{tLabel('documents.selectAllShort', 'Hammasi')}
          </button>
          {/* Copy the selection (also Ctrl+C) — labelled so it is discoverable, not keyboard-only. */}
          <button type="button" title={tLabel('documents.copyHint', 'Belgilangan kataklarni nusxalash (Ctrl+C)')} onClick={() => void copySelection()}
            className="inline-flex items-center gap-1 h-7 px-2 rounded hover:bg-[var(--ep-bg)] text-xs font-medium text-[var(--ep-text)]">
            <Copy className="w-3.5 h-3.5" />{tLabel('documents.copyShort', 'Nusxa')}
          </button>
          {/* Fill down / right (also Ctrl+D / Ctrl+R) — relative formula refs shift, $-locked stay. */}
          <button type="button" title={tLabel('documents.fillDown', 'Pastga to\'ldirish (Ctrl+D)')} onClick={fillDown}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--ep-bg)] text-[var(--ep-text)]"><ArrowDownToLine className="w-3.5 h-3.5" /></button>
          <button type="button" title={tLabel('documents.fillRight', 'O\'ngga to\'ldirish (Ctrl+R)')} onClick={fillRight}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--ep-bg)] text-[var(--ep-text)]"><ArrowRightToLine className="w-3.5 h-3.5" /></button>
          <span className="w-px h-4 bg-[var(--ep-border)] mx-1" />
          {/* Filter toggle */}
          <button type="button" title={tLabel('documents.filter', 'Filtr')} onClick={() => setFilterOn((v) => !v)}
            className={cn('w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--ep-bg)]', filterOn && 'bg-[var(--ep-blue)]/12 text-[var(--ep-blue)]')}><Filter className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Formula bar */}
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-[var(--ep-border)] bg-[var(--ep-surface)]">
        <span className="text-xs font-mono font-semibold text-[var(--ep-muted)] min-w-12 px-1 text-center shrink-0 whitespace-nowrap">{rangeLabel}</span>
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
              <th onClick={selectAll} title={tLabel('documents.selectAll', 'Hammasini belgilash')}
                className="sticky top-0 left-0 z-10 w-10 h-7 bg-[var(--ep-bg)] border border-[var(--ep-border)] cursor-pointer hover:bg-[var(--ep-blue)]/10 relative p-0">
                <span className="absolute bottom-[2px] right-[2px] w-0 h-0 border-l-[7px] border-l-transparent border-b-[7px] border-b-[var(--ep-muted)]" />
              </th>
              {Array.from({ length: cols }, (_, c) => (
                <th key={c} className="sticky top-0 z-[5] min-w-[56px] h-7 bg-[var(--ep-bg)] border border-[var(--ep-border)] text-[11px] font-semibold text-[var(--ep-muted)]">
                  {numToCol(c + 1)}
                </th>
              ))}
            </tr>
            {filterOn && (
              <tr>
                <th className="sticky left-0 z-[4] w-10 h-7 bg-[var(--ep-surface)] border border-[var(--ep-border)]" />
                {Array.from({ length: cols }, (_, c) => (
                  <th key={c} className="min-w-[56px] h-7 bg-[var(--ep-surface)] border border-[var(--ep-border)] p-0.5">
                    <input value={filters[c] ?? ''} onChange={(e) => setFilters((f) => ({ ...f, [c]: e.target.value }))}
                      placeholder={tLabel('documents.filterCol', 'Filtr…')}
                      className="w-full h-6 text-[11px] px-1 rounded border border-[var(--ep-border)] bg-white outline-none font-normal" />
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {visibleRows.map((r) => (
              <tr key={r}>
                <td className="sticky left-0 z-[5] w-10 h-7 bg-[var(--ep-bg)] border border-[var(--ep-border)] text-center text-[11px] font-semibold text-[var(--ep-muted)]">{r + 1}</td>
                {Array.from({ length: cols }, (_, c) => {
                  const ref = numToCol(c + 1) + (r + 1);
                  const isSel = sel === ref;
                  const isEditing = editing === ref;
                  const ranged = !isSel && inRange(ref);
                  const style = cells[ref]?.s;
                  const rawDisplay = evalCell(ref, cells);
                  const display = formatDisplay(rawDisplay, style?.fmt);
                  const isNum = rawDisplay !== '' && !rawDisplay.startsWith('#') && !Number.isNaN(Number(rawDisplay));
                  const align = style?.a ?? (isNum ? 'r' : 'l');
                  const isErr = rawDisplay === '#CYCLE' || rawDisplay === '#ERR';
                  return (
                    <td
                      key={c}
                      onClick={(e) => pick(ref, e.shiftKey)}
                      onDoubleClick={() => startEdit(ref)}
                      style={style?.bg ? { backgroundColor: style.bg } : undefined}
                      className={cn(
                        'min-w-[56px] h-7 px-1.5 cursor-cell align-middle',
                        style?.bd ? 'border-2 border-[var(--ep-text)]' : 'border border-[var(--ep-border)]',
                        // Active cell = ONE crisp blue box. outline (drawn over the border, no layout
                        // shift) with -1px offset covers the grey border instead of sitting inside it,
                        // so it no longer looks like "a cell inside the cell".
                        isSel && 'relative z-10 outline outline-2 outline-[var(--ep-blue)] -outline-offset-1',
                        ranged && 'bg-[var(--ep-blue)]/20',
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
                          className="w-full h-full border-0 outline-none bg-transparent text-sm font-mono"
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

      {/* Grow the sheet — add rows / columns (owner: 'vertikal gorizontal jadval qo'shil bo'lmaydi') */}
      {editable && (
        <div className="flex items-center gap-2 px-2 py-1.5 border-t border-[var(--ep-border)] bg-[var(--ep-surface)]">
          <button type="button" onClick={() => setRows((r) => Math.min(MAX_ROWS, r + 10))} disabled={rows >= MAX_ROWS}
            className="inline-flex items-center gap-1 h-7 px-2 rounded border border-[var(--ep-border)] hover:bg-[var(--ep-bg)] text-xs font-medium disabled:opacity-40">
            <Plus className="w-3.5 h-3.5" />{tLabel('documents.addRows', '10 qator')}
          </button>
          <button type="button" onClick={() => setCols((c) => Math.min(MAX_COLS, c + 1))} disabled={cols >= MAX_COLS}
            className="inline-flex items-center gap-1 h-7 px-2 rounded border border-[var(--ep-border)] hover:bg-[var(--ep-bg)] text-xs font-medium disabled:opacity-40">
            <Plus className="w-3.5 h-3.5" />{tLabel('documents.addCol', 'Ustun')}
          </button>
          <span className="text-[11px] text-[var(--ep-muted)] font-mono">{rows} × {cols}</span>
        </div>
      )}
    </div>
  );
}
