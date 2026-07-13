/**
 * @module spreadsheet
 * @description Client-side spreadsheet cell model + a small formula evaluator for the Jadval
 * (Phase B) custom grid. Daily-80% scope: cell refs (A1), ranges (A1:B3), SUM/AVERAGE/COUNT/IF,
 * and basic arithmetic (+ - * / and parentheses). No backend engine. Cycle-safe.
 * Cells are stored as { "A1": { v?: rawText, f?: "=SUM(...)" }, ... } in erp_spreadsheets.cells.
 */

export interface Cell { v?: string; f?: string }
export type Cells = Record<string, Cell>;

const A1_RE = /^([A-Z]+)([0-9]+)$/;

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
  return expr.replace(/\b([A-Z]+[0-9]+)\b/g, (ref) => {
    const v = evalCell(ref, cells, seen);
    // Propagate errors (#CYCLE/#ERR) as NaN so arithmetic yields #ERR instead of a silent 0.
    return v.startsWith('#') ? 'NaN' : String(toNum(v));
  });
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
  // SUM / AVERAGE / COUNT
  expr = expr.replace(/(SUM|AVERAGE|COUNT)\(([^()]*)\)/gi, (_m, fn, args) => {
    const vals = splitArgs(args)
      .flatMap((a) => (a.includes(':') ? expandRange(a.trim()) : [a.trim()]))
      .map((ref) => (A1_RE.test(ref) ? toNum(evalCell(ref, cells, seen)) : toNum(ref)));
    const f = String(fn).toUpperCase();
    if (f === 'SUM') return String(vals.reduce((s, v) => s + v, 0));
    if (f === 'AVERAGE') return String(vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0);
    return String(vals.filter((v) => v !== 0 || true).length); // COUNT of provided cells
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
