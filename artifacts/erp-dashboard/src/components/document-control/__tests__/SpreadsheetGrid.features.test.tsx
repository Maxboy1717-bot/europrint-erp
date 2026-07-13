/**
 * @module SpreadsheetGrid.features.test
 * @description Proves the owner-requested spreadsheet features in jsdom: select-all (corner) then
 * format applies to the WHOLE range; the fx formula helper inserts a function into the cell; and
 * per-column filtering hides non-matching rows.
 */

import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
import { SpreadsheetGrid } from '../SpreadsheetGrid';
import type { Cells } from '@/lib/spreadsheet';

function setup(initial: Cells = {}) {
  let cells: Cells = initial;
  const onChange = (c: Cells) => { cells = c; };
  const utils = render(<SpreadsheetGrid cells={cells} onChange={onChange} />, { wrapper: TestProviders });
  return { ...utils, get cells() { return cells; } };
}

describe('SpreadsheetGrid — select-all / fx / filter', () => {
  it('select-all button styles the whole 30x12 range and shows the range label', () => {
    const t = setup();
    fireEvent.click(screen.getByText('Hammasi')); // labelled select-all button
    expect(screen.getByText(/A1:L30 \(360\)/)).toBeTruthy(); // visible feedback the range took
    fireEvent.click(screen.getByTitle('Qalin')); // Bold applies to the whole selection
    const styled = Object.values(t.cells);
    expect(styled.length).toBe(30 * 12);
    expect(styled.every((c) => c.s?.b === true)).toBe(true);
  });

  it('fx helper inserts a function into the active cell', () => {
    const t = setup();
    fireEvent.click(screen.getByTitle("Formula qo'shish")); // open fx menu
    fireEvent.click(screen.getByText('SUM')); // pick SUM
    const input = t.container.querySelector('td.cursor-cell input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('=SUM('); // A1 is now editing with the function stub
  });

  it('column filter hides rows that do not match', () => {
    const t = setup({ A1: { v: 'apple' }, A2: { v: 'banana' }, A3: { v: 'apricot' } });
    expect(screen.getByText('banana')).toBeTruthy();
    fireEvent.click(screen.getByTitle('Filtr')); // show filter row
    const colFilter = screen.getAllByPlaceholderText('Filtr…')[0]; // column A
    fireEvent.change(colFilter, { target: { value: 'ap' } }); // matches apple + apricot, not banana
    expect(screen.queryByText('banana')).toBeNull();
    expect(screen.getByText('apple')).toBeTruthy();
    expect(screen.getByText('apricot')).toBeTruthy();
  });
});
