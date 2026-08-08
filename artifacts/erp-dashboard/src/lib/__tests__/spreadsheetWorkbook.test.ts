import { describe, it, expect } from 'vitest';
import { parseWorkbook, serializeWorkbook, nextSheetName, type Workbook } from '../spreadsheetWorkbook';

describe('spreadsheetWorkbook — backward-compatible multi-sheet', () => {
  it('reads legacy v1 flat cells as a single "Varaq 1" sheet', () => {
    const wb = parseWorkbook({ A1: { v: '10' }, B2: { f: '=SUM(A1:A1)' } });
    expect(wb.order).toEqual(['Varaq 1']);
    expect(wb.active).toBe('Varaq 1');
    expect(wb.sheets['Varaq 1'].A1).toEqual({ v: '10' });
  });

  it('reads an empty/undefined value as one empty sheet', () => {
    expect(parseWorkbook(undefined).order).toEqual(['Varaq 1']);
    expect(parseWorkbook({}).sheets['Varaq 1']).toEqual({});
  });

  it('round-trips a v2 workbook (serialize -> parse)', () => {
    const wb: Workbook = {
      order: ['Varaq 1', 'Hisobot'],
      active: 'Hisobot',
      sheets: { 'Varaq 1': { A1: { v: '1' } }, 'Hisobot': { A1: { v: 'x' } } },
    };
    const persisted = serializeWorkbook(wb);
    expect(persisted.__v).toBe(2);
    const back = parseWorkbook(persisted);
    expect(back.order).toEqual(['Varaq 1', 'Hisobot']);
    expect(back.active).toBe('Hisobot');
    expect(back.sheets['Hisobot'].A1).toEqual({ v: 'x' });
  });

  it('drops a stale active/order that no longer matches sheets', () => {
    const back = parseWorkbook({ __v: 2, order: ['Gone', 'A'], active: 'Gone', sheets: { A: {} } });
    expect(back.order).toEqual(['A']);
    expect(back.active).toBe('A');
  });

  it('nextSheetName avoids collisions', () => {
    expect(nextSheetName(['Varaq 1'])).toBe('Varaq 2');
    expect(nextSheetName(['Varaq 1', 'Varaq 2'])).toBe('Varaq 3');
    // length 2 -> starts at "Varaq 3" which is taken -> bumps to "Varaq 4"
    expect(nextSheetName(['Varaq 1', 'Varaq 3'])).toBe('Varaq 4');
  });
});
