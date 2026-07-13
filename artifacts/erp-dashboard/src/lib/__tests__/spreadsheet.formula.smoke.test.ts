import { describe, it, expect } from 'vitest';
import { evalCell, type Cells } from '../spreadsheet';

describe('formula engine smoke', () => {
  const cells: Cells = {
    A1: { v: '10' }, A2: { v: '20' }, A3: { v: '30' },
    B1: { v: 'x' }, B2: { v: 'y' },
    C1: { f: '=SUM(A1:A3)' },
    C2: { f: '=AVERAGE(A1:A3)' },
    C3: { f: '=A1+A2*2' },
    C4: { f: '=IF(A1>5,"big","small")' },
    C5: { f: '=CONCATENATE(B1," ",B2)' },
    C6: { f: '=MAX(A1:A3)' },
    C7: { f: '=ROUND(A2/3,2)' },
    C8: { f: '=COUNTIF(A1:A3,">15")' },
    C9: { f: '=SUM(A1;A2;A3)' },        // semicolon separator (RU/UZ Excel locale)
    C10: { f: '=IF(A1>5;"big";"small")' }, // semicolon separator with text args
  };
  const cases: [string, string][] = [
    ['C1', '60'], ['C2', '20'], ['C3', '50'], ['C4', 'big'],
    ['C5', 'x y'], ['C6', '30'], ['C7', '6.67'], ['C8', '2'],
    ['C9', '60'], ['C10', 'big'],
  ];
  for (const [ref, expected] of cases) {
    it(`${ref} = ${cells[ref].f} -> ${expected}`, () => {
      expect(evalCell(ref, cells)).toBe(expected);
    });
  }
});
