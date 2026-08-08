/**
 * @module spreadsheet
 * @description Client-side spreadsheet cell model + a small formula evaluator for the Jadval
 * (Phase B) custom grid. Daily-80% scope: cell refs (A1), ranges (A1:B3), SUM/AVERAGE/COUNT/IF,
 * and basic arithmetic (+ - * / and parentheses). No backend engine. Cycle-safe.
 * Cells are stored as { "A1": { v?: rawText, f?: "=SUM(...)" }, ... } in erp_spreadsheets.cells.
 */

export interface CellStyle { b?: boolean; a?: 'l' | 'c' | 'r'; fmt?: 'num' | 'money' | 'pct'; bg?: string; bd?: boolean }
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

// Quote-aware arg splitter: separators inside "..." or nested () are not separators. Accepts
// BOTH ',' and ';' as argument separators — many RU/UZ Excel users type '=SUM(A1;A2)' (the
// European/Cyrillic-locale list separator), which otherwise parsed as a single broken arg.
function splitArgs(s: string): string[] {
  const out: string[] = []; let depth = 0, cur = '', inQ = false;
  for (const ch of s) {
    if (ch === '"') inQ = !inQ;
    if (!inQ && ch === '(') depth++;
    if (!inQ && ch === ')') depth--;
    if (!inQ && (ch === ',' || ch === ';') && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim() !== '') out.push(cur);
  return out;
}

const numOut = (x: number): string => (Number.isNaN(x) || !Number.isFinite(x)) ? '#ERR' : String(Math.round(x * 1e10) / 1e10);

/** Flatten an arg list into individual cell refs / literals (expanding A1:B3 ranges). */
function flattenRefs(args: string[]): string[] {
  return args.flatMap((a) => (a.includes(':') ? expandRange(normRef(a.trim())) : [a.trim()]));
}
const cellNum = (ref: string, cells: Cells, seen: Set<string>): number =>
  A1_RE.test(normRef(ref)) ? toNum(evalCell(normRef(ref), cells, seen)) : toNum(ref);
const cellStr = (ref: string, cells: Cells, seen: Set<string>): string =>
  A1_RE.test(normRef(ref)) ? evalCell(normRef(ref), cells, seen) : ref;

/** SUMIF/COUNTIF/AVERAGEIF criteria: ">5", "<=3", "<>x", or a plain equals value. */
function matchCriteria(value: string, criteriaRaw: string): boolean {
  const c = criteriaRaw.trim();
  const m = c.match(/^(<=|>=|<>|=|<|>)(.*)$/);
  if (m) {
    const op = m[1], rhs = m[2].trim();
    const vn = Number(value), rn = Number(rhs);
    if (!Number.isNaN(vn) && !Number.isNaN(rn)) {
      switch (op) { case '>': return vn > rn; case '<': return vn < rn; case '>=': return vn >= rn; case '<=': return vn <= rn; case '<>': return vn !== rn; default: return vn === rn; }
    }
    if (op === '<>') return value !== rhs;
    return value === rhs;
  }
  return value === c;
}
function condAgg(kind: 'sum' | 'count' | 'avg', args: string[], cells: Cells, seen: Set<string>): string {
  const range = expandRange(normRef((args[0] ?? '').trim()));
  const crit = argText(args[1] ?? '', cells, seen);
  const sumRange = args[2] ? expandRange(normRef(args[2].trim())) : range;
  let sum = 0, count = 0;
  range.forEach((ref, i) => {
    if (matchCriteria(evalCell(ref, cells, seen), crit)) { count++; sum += toNum(evalCell(sumRange[i] ?? ref, cells, seen)); }
  });
  if (kind === 'count') return String(count);
  if (kind === 'avg') return count ? numOut(sum / count) : '#ERR';
  return numOut(sum);
}
function truthyArg(a: string, cells: Cells, seen: Set<string>): boolean {
  const t = a.trim();
  if (/(<=|>=|<>|!=|==|=|<|>)/.test(t)) return evalCondition(t, cells, seen);
  const up = t.replace(/"/g, '').toUpperCase();
  if (up === 'TRUE') return true;
  if (up === 'FALSE') return false;
  return evalArith(resolveRefs(t, cells, seen)) !== 0;
}
function vlookup(args: string[], cells: Cells, seen: Set<string>): string {
  if (args.length < 3) return '#ERR';
  const key = argText(args[0], cells, seen);
  const col = Math.round(evalArith(resolveRefs(args[2], cells, seen)));
  const [s, e] = normRef(args[1].trim()).split(':');
  const ms = A1_RE.exec(s ?? ''), me = A1_RE.exec(e ?? '');
  if (!ms || !me) return '#ERR';
  const c1 = colToNum(ms[1]), r1 = +ms[2], r2 = +me[2];
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
    if (String(evalCell(numToCol(c1) + r, cells, seen)) === key) return `"${evalCell(numToCol(c1 + col - 1) + r, cells, seen)}"`;
  }
  return '#ERR';
}

// Dispatch one function call. Returns a numeric string, a quoted "text", or TRUE/FALSE.
function callFn(name: string, args: string[], cells: Cells, seen: Set<string>): string {
  const U = name.toUpperCase();
  const n = (i: number) => evalArith(resolveRefs(args[i] ?? '', cells, seen));
  const s = (i: number) => argText(args[i] ?? '', cells, seen);
  const q = (t: string) => `"${t}"`;
  const numsAll = () => flattenRefs(args).map((r) => cellNum(r, cells, seen));
  switch (U) {
    case 'SUM': return numOut(numsAll().reduce((a, b) => a + b, 0));
    case 'PRODUCT': return numOut(numsAll().reduce((a, b) => a * b, 1));
    case 'AVERAGE': { const v = numsAll(); return v.length ? numOut(v.reduce((a, b) => a + b, 0) / v.length) : '0'; }
    case 'MIN': { const v = numsAll(); return v.length ? numOut(Math.min(...v)) : '0'; }
    case 'MAX': { const v = numsAll(); return v.length ? numOut(Math.max(...v)) : '0'; }
    case 'MEDIAN': { const v = numsAll().slice().sort((a, b) => a - b); if (!v.length) return '0'; const m = Math.floor(v.length / 2); return numOut(v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2); }
    case 'COUNT': return String(flattenRefs(args).map((r) => cellStr(r, cells, seen)).filter((x) => x !== '' && !Number.isNaN(Number(x))).length);
    case 'COUNTA': return String(flattenRefs(args).map((r) => cellStr(r, cells, seen)).filter((x) => x !== '').length);
    case 'SUMIF': return condAgg('sum', args, cells, seen);
    case 'COUNTIF': return condAgg('count', args, cells, seen);
    case 'AVERAGEIF': return condAgg('avg', args, cells, seen);
    case 'ABS': return numOut(Math.abs(n(0)));
    case 'SQRT': return numOut(Math.sqrt(n(0)));
    case 'INT': return numOut(Math.floor(n(0)));
    case 'SIGN': return numOut(Math.sign(n(0)));
    case 'POWER': return numOut(Math.pow(n(0), n(1)));
    case 'MOD': return numOut(n(0) % n(1));
    case 'ROUND': { const d = Math.round(n(1)); const f = Math.pow(10, d); return numOut(Math.round(n(0) * f) / f); }
    case 'ROUNDUP': { const d = Math.round(n(1)); const f = Math.pow(10, d); return numOut(Math.ceil(n(0) * f) / f); }
    case 'ROUNDDOWN': { const d = Math.round(n(1)); const f = Math.pow(10, d); return numOut(Math.trunc(n(0) * f) / f); }
    case 'CONCATENATE': return q(args.map((_, i) => s(i)).join(''));
    case 'UPPER': return q(s(0).toUpperCase());
    case 'LOWER': return q(s(0).toLowerCase());
    case 'TRIM': return q(s(0).trim());
    case 'LEN': return String(s(0).length);
    case 'LEFT': { const k = args[1] ? Math.round(n(1)) : 1; return q(s(0).slice(0, Math.max(0, k))); }
    case 'RIGHT': { const k = args[1] ? Math.round(n(1)) : 1; return q(k > 0 ? s(0).slice(-k) : ''); }
    case 'MID': { const start = Math.max(0, Math.round(n(1)) - 1); const len = Math.max(0, Math.round(n(2))); return q(s(0).substring(start, start + len)); }
    case 'IF': return evalCondition(args[0] ?? '', cells, seen) ? (args[1] ?? '').trim() : (args[2] ?? '').trim();
    case 'AND': return args.every((a) => truthyArg(a, cells, seen)) ? 'TRUE' : 'FALSE';
    case 'OR': return args.some((a) => truthyArg(a, cells, seen)) ? 'TRUE' : 'FALSE';
    case 'NOT': return truthyArg(args[0] ?? '', cells, seen) ? 'FALSE' : 'TRUE';
    case 'VLOOKUP': return vlookup(args, cells, seen);
    case 'TODAY': return q(new Date().toLocaleDateString('uz-UZ'));
    case 'NOW': return q(new Date().toLocaleString('uz-UZ'));
    default: return '#NAME?';
  }
}

// Innermost-first function-call resolver: repeatedly replace the innermost NAME(args) via the
// dispatch table until none remain, then evaluate the leftover arithmetic. Nested calls resolve
// naturally (the inner one has no parens inside, so it matches first).
function evalFormula(expr: string, cells: Cells, seen: Set<string>): string {
  const FN = /([A-Za-z][A-Za-z0-9]*)\s*\(([^()]*)\)/;
  let prev = '', guard = 0;
  while (prev !== expr && guard++ < 200) {
    prev = expr;
    expr = expr.replace(FN, (_m, name, inner) => callFn(name, splitArgs(inner), cells, seen));
  }
  // Preserve a standalone error marker (#NAME?/#ERR/#CYCLE) instead of the arithmetic pass
  // swallowing it into a generic #ERR.
  if (expr.trim().startsWith('#')) return expr.trim();
  // A leftover quoted string literal → return it unquoted (text result).
  const strLit = expr.trim().match(/^"(.*)"$/);
  if (strLit) return strLit[1];
  const up = expr.trim().toUpperCase();
  if (up === 'TRUE' || up === 'FALSE') return up;
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
