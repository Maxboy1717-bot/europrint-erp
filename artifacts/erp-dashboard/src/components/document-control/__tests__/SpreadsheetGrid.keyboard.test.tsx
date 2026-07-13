/**
 * @module SpreadsheetGrid.keyboard.test
 * @description Proves Excel-style cell entry in jsdom: a SINGLE click selects a cell and typing
 * immediately edits it (no double-click), Enter commits + moves down, and double-click still
 * edits an existing value in place. Guards the fix for the owner's "2 marta bosish kerak" bug.
 */

import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
import { SpreadsheetGrid } from '../SpreadsheetGrid';
import type { Cells } from '@/lib/spreadsheet';

function setup(initial: Cells = {}) {
  let cells: Cells = initial;
  const onChange = (c: Cells) => { cells = c; };
  const utils = render(<SpreadsheetGrid cells={cells} onChange={onChange} />, { wrapper: TestProviders });
  const dataCells = utils.container.querySelectorAll('td.cursor-cell');
  const grid = utils.container.querySelector('[tabindex]') as HTMLElement;
  return { ...utils, get cells() { return cells; }, dataCells, grid };
}

describe('SpreadsheetGrid — Excel-style keyboard entry', () => {
  it('single click + type edits the cell immediately (no double-click)', () => {
    const t = setup();
    fireEvent.click(t.dataCells[0]); // A1 — single click selects
    fireEvent.keyDown(t.grid, { key: '5' }); // typing starts editing with the char
    const input = t.dataCells[0].querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('5'); // the typed char is already in the editor
    fireEvent.keyDown(input, { key: 'Enter' }); // commit
    expect(t.cells['A1']).toEqual({ v: '5' });
  });

  it('typing a letter starts a fresh value (overwrites), not append', () => {
    const t = setup({ A1: { v: 'old' } });
    fireEvent.click(t.dataCells[0]);
    fireEvent.keyDown(t.grid, { key: 'X' });
    const input = t.dataCells[0].querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('X'); // replaced 'old', not 'oldX'
  });

  it('double-click still edits the existing value in place', () => {
    const t = setup({ A1: { v: 'hello' } });
    fireEvent.doubleClick(t.dataCells[0]);
    const input = t.dataCells[0].querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('hello'); // existing value loaded for in-place edit
  });

  it('editing a cell then blurring (clicking away to Save, no Enter) commits the value', () => {
    // This is what backs the "Excel not saving" fix: the last edit must land in onChange (which
    // the editor mirrors into cellsRef) when the user clicks Save without pressing Enter.
    const t = setup();
    fireEvent.click(t.dataCells[0]); // A1
    fireEvent.keyDown(t.grid, { key: '9' }); // start editing with '9'
    const input = t.dataCells[0].querySelector('input') as HTMLInputElement;
    fireEvent.blur(input); // focus leaves to the Save button — no Enter pressed
    expect(t.cells['A1']).toEqual({ v: '9' });
  });
});
