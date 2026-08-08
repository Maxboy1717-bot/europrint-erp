/**
 * @module spreadsheetFill
 * @description P1-8 fill (Ctrl+D down / Ctrl+R right) + P1-6 absolute-reference semantics. The
 * hard, correctness-critical part is offsetFormula: when a formula is filled to another cell, its
 * RELATIVE refs (A1) shift by the fill offset, while ABSOLUTE refs ($A$1) and mixed refs ($A1 /
 * A$1) keep their $-locked component fixed — this is exactly what makes `$` meaningful. Plain
 * values (and styles) copy unchanged. Heavily unit-tested because a wrong offset silently
 * corrupts a spreadsheet.
 */

import { colToNum, numToCol, type Cell } from './spreadsheet';

// Matches a cell ref with optional $ locks: [$]COL[$]ROW  e.g. A1, $A$1, $A1, A$1.
const REF_RE = /(\$?)([A-Za-z]+)(\$?)([0-9]+)/g;

/** Shift every RELATIVE component of every cell ref in `formula` by (dc, dr); keep $-locked ones. */
export function offsetFormula(formula: string, dc: number, dr: number): string {
  return formula.replace(REF_RE, (_m, cAbs: string, col: string, rAbs: string, row: string) => {
    let c = colToNum(col.toUpperCase());
    let r = parseInt(row, 10);
    if (!cAbs) c = Math.max(1, c + dc);
    if (!rAbs) r = Math.max(1, r + dr);
    return `${cAbs}${numToCol(c)}${rAbs}${r}`;
  });
}

/** Produce the cell to place at a fill target `(dc, dr)` cells away from `source`. */
export function fillCell(source: Cell | undefined, dc: number, dr: number): Cell | undefined {
  if (!source) return undefined;
  if (source.f) return { ...source, f: offsetFormula(source.f, dc, dr) };
  return { ...source }; // value (+style) copies unchanged
}
