/**
 * @module spreadsheet
 * @description Client-side spreadsheet cell model + a small formula evaluator for the Jadval
 * (Phase B) custom grid. Daily-80% scope: cell refs (A1), ranges (A1:B3), SUM/AVERAGE/COUNT/IF,
 * and basic arithmetic (+ - * / and parentheses). No backend engine. Cycle-safe.
 * Cells are stored as { "A1": { v?: rawText, f?: "=SUM(...)" }, ... } in erp_spreadsheets.cells.
 */

export interface CellStyle { b?: boolean; a?: 'l' | 'c' | 'r'; fmt?: 'num' | 'money' | 'pct' }
export interface Cell { v?: string; f?: string; s?: CellStyle }
export type Cells = Record<string, Cell>;

/** Apply a cell's number-format to its evaluated display value. */
export function formatDisplay(display: string, fmt?: string): string {
  if (!fmt || fmt === 'num' || display === '' || display.startsWith('#')) return display;
  const n = Number(display);
  if (Number.isNaN(n)) return display;
  if (fmt === 'money') return n.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (fmt === 'pct') return n.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) + '%';
  return display;
}

// Absolute ($A$1) and relative (A1) refs both evaluate the same; $ only matters for fill/copy.
const A1_RE = /^\$?([A-Z]+)\$?([0-9]+)$/;
const normRef = (ref: string) => ref.replace(/\$/g, '');

export function colToNum(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
export function numToCol(n: number): string {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
export function cellRef(col: number, row: number): string { return numToCol(col) + row; }

function expandRange(range: string): string[] {
  const [a, b] = range.split(':');
  const ma = A1_RE.exec(a?.trim() ?? ''), mb = A1_RE.exec(b?.trim() ?? '');
  if (!ma || !mb) return [];
  const c1 = colToNum(ma[1]), r1 = +ma[2], c2 = colToNum(mb[1]), r2 = +mb[2];
  const out: string[] = [];
  for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++)
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) out.push(numToCol(c) + r);
  return out;
}

function toNum(v: string | number | undefined): number {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isNaN(n) ? 0 : n;
}

// Safe arithmetic: only digits, operators, dot, parens, spaces allowed.
function evalArith(expr: string): number {
  const clean = expr.trim();
  if (clean === '') return 0;
  if (!/^[-+*/(). 0-9]+$/.test(clean)) return NaN;
  try {
    // eslint-disable-next-line no-new-func
    const r = Function(`"use strict"; return (${clean});`)();
    return typeof r === 'number' && Number.isFinite(r) ? r : NaN;
  } catch { return NaN; }
}

function resolveRefs(expr: string, cells: Cells, seen: Set<string>): string {
  return expr.replace(/\$?[A-Z]+\$?[0-9]+/g, (ref) => {
    const v = evalCell(normRef(ref), cells, seen);
    // Propagate errors (#CYCLE/#ERR) as NaN so arithmetic yields #ERR instead of a silent 0.
    return v.startsWith('#') ? 'NaN' : String(toNum(v));
  });
}

/** Resolve one function arg to a text value (quoted-literal, cell ref, or raw). */
function argText(a: string, cells: Cells, seen: Set<string>): string {
  const t = a.trim();
  const sl = t.match(/^"(.*)"$/);
  if (sl) return sl[1];
  const nr = normRef(t);
  return A1_RE.test(nr) ? evalCell(nr, cells, seen) : t;
}

function evalCondition(cond: string, cells: Cells, seen: Set<string>): boolean {
  const m = cond.match(/^(.+?)(<=|>=|<>|!=|==|=|<|>)(.+)$/);
  if (!m) return toNum(resolveRefs(cond, cells, seen)) !== 0;
  const l = evalArith(resolveRefs(m[1], cells, seen));
  const r = evalArith(resolveRefs(m[3], cells, seen));
  switch (m[2]) {
    case '<': return l < r; case '>': return l > r;
    case '<=': return l <= r; case '>=': return l >= r;
    case '<>': case '!=': return l !== r;
    default: return l === r;
  }
}

function splitArgs(s: string): string[] {
  const out: string[] = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++; if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim() !== '') out.push(cur);
  return out;
}

function evalFormula(expr: string, cells: Cells, seen: Set<string>): string {
  // IF(cond, a, b) — evaluated first (may contain the others)
  let prev = '';
  while (prev !== expr) {
    prev = expr;
    expr = expr.replace(/IF\(([^()]*(?:\([^()]*\)[^()]*)*)\)/i, (_m, inner) => {
      const args = splitArgs(inner);
      if (args.length < 3) return '0';
      // Keep a quoted-string branch quoted so the outer pass returns it as text (not re-parsed
      // as arithmetic); evaluate a formula/number branch normally.
      const branch = (a: string) => { const t = a.trim(); return /^".*"$/.test(t) ? t : evalFormula(t, cells, seen); };
      return evalCondition(args[0], cells, seen) ? branch(args[1]) : branch(args[2]);
    });
  }
  // Zero-arg date functions.
  expr = expr.replace(/\bTODAY\(\s*\)/gi, () => `"${new Date().toLocaleDateString('uz-UZ')}"`);
  expr = expr.replace(/\bNOW\(\s*\)/gi, () => `"${new Date().toLocaleString('uz-UZ')}"`);
  // ROUND(x, n) — innermost-first via loop.
  let pr = '';
  while (pr !== expr) {
    pr = expr;
    expr = expr.replace(/ROUND\(([^()]*)\)/i, (_m, inner) => {
      const a = splitArgs(inner);
      const x = evalArith(resolveRefs(a[0] ?? '0', cells, seen));
      const d = Math.round(evalArith(resolveRefs(a[1] ?? '0', cells, seen)));
      const f = Math.pow(10, d);
      return Number.isNaN(x) ? '#ERR' : String(Math.round(x * f) / f);
    });
  }
  // CONCATENATE(a, b, ...) -> quoted text.
  expr = expr.replace(/CONCATENATE\(([^()]*)\)/gi, (_m, inner) =>
    `"${splitArgs(inner).map((a) => argText(a, cells, seen)).join('')}"`);
  // VLOOKUP(key, range, colIndex) — search col 1 of range for key, return colIndex cell.
  expr = expr.replace(/VLOOKUP\(([^()]*)\)/gi, (_m, inner) => {
    const a = splitArgs(inner);
    if (a.length < 3) return '#ERR';
    const key = String(argText(a[0], cells, seen));
    const col = Math.round(evalArith(resolveRefs(a[2], cells, seen)));
    const [s, e] = normRef(a[1].trim()).split(':');
    const ms = A1_RE.exec(s ?? ''), me = A1_RE.exec(e ?? '');
    if (!ms || !me) return '#ERR';
    const c1 = colToNum(ms[1]), r1 = +ms[2], r2 = +me[2];
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
      if (String(evalCell(numToCol(c1) + r, cells, seen)) === key) {
        return `"${evalCell(numToCol(c1 + col - 1) + r, cells, seen)}"`;
      }
    }
    return '#ERR';
  });
  // SUM / AVERAGE / COUNT / MIN / MAX
  expr = expr.replace(/(SUM|AVERAGE|COUNT|MIN|MAX)\(([^()]*)\)/gi, (_m, fn, args) => {
    const vals = splitArgs(args)
      .flatMap((a) => (a.includes(':') ? expandRange(a.trim()) : [a.trim()]))
      .map((ref) => (A1_RE.test(normRef(ref)) ? toNum(evalCell(normRef(ref), cells, seen)) : toNum(ref)));
    const f = String(fn).toUpperCase();
    if (f === 'SUM') return String(vals.reduce((s, v) => s + v, 0));
    if (f === 'AVERAGE') return String(vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0);
    if (f === 'MIN') return String(vals.length ? Math.min(...vals) : 0);
    if (f === 'MAX') return String(vals.length ? Math.max(...vals) : 0);
    return String(vals.length); // COUNT of provided cells
  });
  // If a quoted string literal remains, return it unquoted.
  const strLit = expr.trim().match(/^"(.*)"$/);
  if (strLit) return strLit[1];
  const n = evalArith(resolveRefs(expr, cells, seen));
  return Number.isNaN(n) ? '#ERR' : String(Math.round(n * 1e10) / 1e10);
}

/** Displayed value of a cell (evaluates a formula, else the raw text). Cycle-safe. */
export function evalCell(ref: string, cells: Cells, seen: Set<string> = new Set()): string {
  if (seen.has(ref)) return '#CYCLE';
  const cell = cells[ref];
  if (!cell) return '';
  if (cell.f && cell.f.trim().startsWith('=')) {
    seen.add(ref);
    const out = evalFormula(cell.f.trim().slice(1), cells, seen);
    seen.delete(ref);
    return out;
  }
  return cell.v ?? '';
}
