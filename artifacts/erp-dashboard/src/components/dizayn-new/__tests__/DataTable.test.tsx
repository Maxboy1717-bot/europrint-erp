/**
 * @module DataTable.test (dizayn-new)
 * @description Component tests for DataTableRedesign — title, search filter,
 * loading skeleton, row rendering, no-results message, StatusBadge variants.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { DataTableRedesign, StatusBadge, type TableColumn } from '../DataTable';

interface Row {
  id: number;
  name: string;
  position: string;
}

const cols: TableColumn<Row>[] = [
  { key: 'name', label: 'Ism', sortable: true },
  { key: 'position', label: 'Lavozim' },
];

const data: Row[] = [
  { id: 1, name: 'Alisher', position: 'Operator' },
  { id: 2, name: 'Bobur', position: 'Manager' },
];

describe('DataTableRedesign (dizayn-new)', () => {
  it('renders title when title prop is provided', () => {
    render(
      <DataTableRedesign title="Xodimlar" columns={cols} data={data} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Xodimlar')).toBeTruthy();
  });

  it('renders each row when data is provided', () => {
    render(
      <DataTableRedesign columns={cols} data={data} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('Alisher')).toBeTruthy();
    expect(screen.getByText('Bobur')).toBeTruthy();
  });

  it('renders no-results message when filtered data is empty', () => {
    render(
      <DataTableRedesign columns={cols} data={[]} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/noResults/i)).toBeTruthy();
  });

  it('filters rows by search text when user types', () => {
    render(
      <DataTableRedesign columns={cols} data={data} />,
      { wrapper: TestProviders },
    );
    const search = screen.getByLabelText(/search/i);
    fireEvent.change(search, { target: { value: 'Bobur' } });
    expect(screen.queryByText('Alisher')).toBeNull();
    expect(screen.getByText('Bobur')).toBeTruthy();
  });

  it('shows loading skeleton rows when isLoading is true', () => {
    const { container } = render(
      <DataTableRedesign columns={cols} data={data} isLoading={true} />,
      { wrapper: TestProviders },
    );
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it('renders add button when onAdd is provided', () => {
    const onAdd = vi.fn();
    render(
      <DataTableRedesign columns={cols} data={data} onAdd={onAdd} addLabel="+ Add" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('+ Add')).toBeTruthy();
  });

  it('calls onAdd when add button is clicked', () => {
    const onAdd = vi.fn();
    render(
      <DataTableRedesign columns={cols} data={data} onAdd={onAdd} addLabel="+ New" />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByText('+ New'));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('renders StatusBadge with active label when status is active', () => {
    render(<StatusBadge status="active" />, { wrapper: TestProviders });
    expect(screen.getByText('Aktiv')).toBeTruthy();
  });
});
