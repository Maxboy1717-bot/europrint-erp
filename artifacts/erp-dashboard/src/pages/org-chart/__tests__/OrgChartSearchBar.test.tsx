/**
 * OrgChartSearchBar.test.tsx — Phase 6 T6.1
 *
 * Controlled-input behaviour for the search bar that drives `searchTree`.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrgChartSearchBar } from '../OrgChartSearchBar';

describe('OrgChartSearchBar', () => {
  it('renders an input with placeholder and aria-label', () => {
    render(<OrgChartSearchBar value="" onChange={() => undefined} matchCount={0} />);
    const input = screen.getByTestId('orgchart-search-input') as HTMLInputElement;
    expect(input.placeholder).toMatch(/qidirish/i);
    expect(input.getAttribute('aria-label')).toMatch(/qidirish/i);
  });

  it('emits onChange with every keystroke', () => {
    const onChange = vi.fn();
    render(<OrgChartSearchBar value="" onChange={onChange} matchCount={0} />);
    fireEvent.change(screen.getByTestId('orgchart-search-input'), { target: { value: 'eng' } });
    expect(onChange).toHaveBeenCalledWith('eng');
  });

  it('hides match counter and clear button when query is empty', () => {
    render(<OrgChartSearchBar value="" onChange={() => undefined} matchCount={0} />);
    expect(screen.queryByTestId('orgchart-search-count')).toBeNull();
    expect(screen.queryByTestId('orgchart-search-clear')).toBeNull();
  });

  it('shows match count when query is set', () => {
    render(<OrgChartSearchBar value="eng" onChange={() => undefined} matchCount={3} />);
    expect(screen.getByTestId('orgchart-search-count').textContent).toMatch(/3 ta/);
  });

  it('shows "Natija topilmadi" when matchCount = 0 and query is set', () => {
    render(<OrgChartSearchBar value="zzz" onChange={() => undefined} matchCount={0} />);
    expect(screen.getByTestId('orgchart-search-count').textContent).toMatch(/topilmadi/i);
  });

  it('clear button calls onChange with empty string', () => {
    const onChange = vi.fn();
    render(<OrgChartSearchBar value="eng" onChange={onChange} matchCount={1} />);
    fireEvent.click(screen.getByTestId('orgchart-search-clear'));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
