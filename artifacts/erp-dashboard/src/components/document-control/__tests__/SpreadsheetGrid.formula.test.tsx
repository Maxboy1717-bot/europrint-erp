import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { TestProviders } from '@/test/TestProviders';
import { SpreadsheetGrid } from '../SpreadsheetGrid';
import type { Cells } from '@/lib/spreadsheet';

function renderControlled(initial: Cells) {
  function Wrap() {
    const [cells, setCells] = useState<Cells>(initial);
    return <SpreadsheetGrid cells={cells} onChange={setCells} />;
  }
  const utils = render(<Wrap />, { wrapper: TestProviders });
  const grid = utils.container.querySelector('[tabindex]') as HTMLElement;
  return { utils, grid, cellAt: (i: number) => utils.container.querySelectorAll('td.cursor-cell')[i] as HTMLElement };
}

describe('SpreadsheetGrid — typing a formula shows its result', () => {
  it('=SUM(A1:B1) typed into C1 renders 30', () => {
    const t = renderControlled({ A1: { v: '10' }, B1: { v: '20' } });
    const c1 = t.cellAt(2); // row1: A1=0, B1=1, C1=2
    fireEvent.click(c1);
    fireEvent.keyDown(t.grid, { key: '=' }); // start editing with '='
    const input = c1.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '=SUM(A1:B1)' } });
    fireEvent.keyDown(input, { key: 'Enter' }); // commit
    expect(t.cellAt(2).textContent).toContain('30');
  });

  it('=A1*2 typed into C1 renders 20', () => {
    const t = renderControlled({ A1: { v: '10' } });
    const c1 = t.cellAt(2);
    fireEvent.click(c1);
    fireEvent.keyDown(t.grid, { key: '=' });
    const input = c1.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '=A1*2' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(t.cellAt(2).textContent).toContain('20');
  });
});
