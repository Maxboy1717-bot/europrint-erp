/**
 * @module spreadsheet.test
 * @description Self-audit (#4): assert every supported formula and reference form evaluates
 * correctly via evalCell — the real engine the grid uses (no DOM needed). Guards the owner's
 * MIN/MAX/ROUND/CONCATENATE/VLOOKUP/TODAY/NOW + $absolute-ref claims.
 */

import { describe, it, expect } from 'vitest';
import { evalCell, type Cells } from '../spreadsheet';

const C: Cells = {
  A1: { v: '10' }, A2: { v: '20' }, A3: { v: '30' },
  B1: { v: 'a' }, B2: { v: 'b' }, B3: { v: 'c' },
  C1: { v: '1' }, C2: { v: '2' }, C3: { v: '3' },
};
const ev = (f: string, extra: Cells = {}) => evalCell('Z1', { ...C, ...extra, Z1: { f } });

describe('spreadsheet formula engine', () => {
  it('SUM / AVERAGE / COUNT', () => {
    expect(ev('=SUM(A1:A3)')).toBe('60');
    expect(ev('=AVERAGE(A1:A3)')).toBe('20');
    expect(ev('=COUNT(A1:A3)')).toBe('3');
  });
  it('MIN / MAX', () => {
    expect(ev('=MIN(A1:A3)')).toBe('10');
    expect(ev('=MAX(A1:A3)')).toBe('30');
  });
  it('ROUND', () => {
    expect(ev('=ROUND(3.14159,2)')).toBe('3.14');
    expect(ev('=ROUND(2.5,0)')).toBe('3');
  });
  it('IF (string and numeric branches)', () => {
    expect(ev('=IF(A1>5,"katta","kichik")')).toBe('katta');
    expect(ev('=IF(A1<5,"katta","kichik")')).toBe('kichik');
    expect(ev('=IF(A1>5,A2,A3)')).toBe('20');
  });
  it('CONCATENATE', () => {
    expect(ev('=CONCATENATE(B1,B2,B3)')).toBe('abc');
    expect(ev('=CONCATENATE("Salom ",A1)')).toBe('Salom 10');
  });
  it('VLOOKUP (find key in col 1, return colIndex)', () => {
    // table B1:C3 = a/1, b/2, c/3 → look up "b" → column 2 → "2"
    expect(ev('=VLOOKUP("b",B1:C3,2)')).toBe('2');
  });
  it('arithmetic + absolute refs ($A$1)', () => {
    expect(ev('=A1+A2')).toBe('30');
    expect(ev('=$A$1+$A$2')).toBe('30');
    expect(ev('=$A1*C$1')).toBe('10');
    expect(ev('=(A1+A2)/A1')).toBe('3');
  });
  it('TODAY / NOW return a non-empty date string', () => {
    expect(ev('=TODAY()').length).toBeGreaterThan(4);
    expect(ev('=NOW()').length).toBeGreaterThan(4);
  });
  it('single-arg math: ABS / SQRT / INT / SIGN', () => {
    expect(ev('=ABS(0-5)')).toBe('5');
    expect(ev('=SQRT(9)')).toBe('3');
    expect(ev('=INT(3.7)')).toBe('3');
    expect(ev('=SIGN(0-2)')).toBe('-1');
  });
  it('two-arg math: POWER / MOD / ROUNDUP / ROUNDDOWN', () => {
    expect(ev('=POWER(2,3)')).toBe('8');
    expect(ev('=MOD(7,3)')).toBe('1');
    expect(ev('=ROUNDUP(2.1,0)')).toBe('3');
    expect(ev('=ROUNDDOWN(2.9,0)')).toBe('2');
  });
  it('PRODUCT / MEDIAN / COUNTA', () => {
    expect(ev('=PRODUCT(A1:A3)')).toBe('6000'); // 10*20*30
    expect(ev('=MEDIAN(A1:A3)')).toBe('20');
    expect(ev('=COUNTA(B1:B3)')).toBe('3');
  });
  it('conditional aggregates: SUMIF / COUNTIF / AVERAGEIF', () => {
    expect(ev('=SUMIF(A1:A3,">15")')).toBe('50');   // 20 + 30
    expect(ev('=COUNTIF(A1:A3,">15")')).toBe('2');
    expect(ev('=AVERAGEIF(A1:A3,">15")')).toBe('25');
  });
  it('text: LEFT / RIGHT / MID / LEN / UPPER / LOWER / TRIM', () => {
    expect(ev('=LEFT("hello",2)')).toBe('he');
    expect(ev('=RIGHT("hello",2)')).toBe('lo');
    expect(ev('=MID("hello",2,3)')).toBe('ell');
    expect(ev('=LEN("hello")')).toBe('5');
    expect(ev('=UPPER("ab")')).toBe('AB');
    expect(ev('=LOWER("AB")')).toBe('ab');
    expect(ev('=TRIM(" x ")')).toBe('x');
  });
  it('logical: AND / OR / NOT', () => {
    expect(ev('=AND(A1>5,A2>5)')).toBe('TRUE');
    expect(ev('=OR(A1>100,A2>5)')).toBe('TRUE');
    expect(ev('=NOT(A1>100)')).toBe('TRUE');
  });
  it('nested function calls resolve innermost-first', () => {
    expect(ev('=SUM(A1:A2)+ABS(0-5)')).toBe('35'); // 30 + 5
    expect(ev('=ROUND(SQRT(2),3)')).toBe('1.414');
    expect(ev('=MAX(MIN(A1:A3),A2)')).toBe('20');  // MIN=10, MAX(10,20)=20
  });
  it('unknown function → #NAME?', () => {
    expect(ev('=BOGUS(A1)')).toBe('#NAME?');
  });

  it('errors: self-referential cycle is caught (does not hang or return a number)', () => {
    // Cycle is detected; inside arithmetic it surfaces as #ERR (the NaN propagation), which is
    // the correct guard — the key guarantee is an error marker, never a wrong number.
    expect(evalCell('Z1', { Z1: { f: '=Z1+1' } })).toMatch(/#(CYCLE|ERR)/);
    // A two-cell mutual cycle likewise resolves to an error, not an infinite loop.
    expect(evalCell('Z1', { Z1: { f: '=Z2' }, Z2: { f: '=Z1' } })).toMatch(/#(CYCLE|ERR)/);
  });
});
