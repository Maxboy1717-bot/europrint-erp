import { describe, it, expect } from 'vitest';
import { offsetFormula, fillCell } from '../spreadsheetFill';

describe('offsetFormula — relative shift, absolute locked', () => {
  it('shifts a relative ref down', () => {
    expect(offsetFormula('=A1+B1', 0, 1)).toBe('=A2+B2');
  });
  it('shifts a relative ref right', () => {
    expect(offsetFormula('=A1', 1, 0)).toBe('=B1');
  });
  it('keeps a fully-absolute ref fixed', () => {
    expect(offsetFormula('=$A$1', 3, 5)).toBe('=$A$1');
  });
  it('honours mixed refs — $A1 locks column, A$1 locks row', () => {
    expect(offsetFormula('=$A1', 2, 3)).toBe('=$A4');   // col locked, row +3
    expect(offsetFormula('=A$1', 2, 3)).toBe('=C$1');   // row locked, col +2
  });
  it('shifts ranges (both endpoints)', () => {
    expect(offsetFormula('=SUM(A1:A3)', 0, 1)).toBe('=SUM(A2:A4)');
  });
  it('mix of absolute + relative in one formula (classic VLOOKUP pattern)', () => {
    expect(offsetFormula('=A2*$C$1', 0, 1)).toBe('=A3*$C$1');
  });
  it('clamps at the grid edge (no col/row < 1)', () => {
    expect(offsetFormula('=A1', -5, -5)).toBe('=A1');
  });
});

describe('fillCell', () => {
  it('copies a plain value + style unchanged', () => {
    expect(fillCell({ v: '10', s: { b: true } }, 0, 3)).toEqual({ v: '10', s: { b: true } });
  });
  it('offsets a formula by the fill delta', () => {
    expect(fillCell({ f: '=A1+$B$1' }, 0, 2)).toEqual({ f: '=A3+$B$1' });
  });
  it('returns undefined for an empty source', () => {
    expect(fillCell(undefined, 0, 1)).toBeUndefined();
  });
});
