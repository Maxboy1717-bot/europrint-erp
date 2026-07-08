/**
 * @module ImportNodesDialog.test
 * @description VISION-3340 #26 — covers the pure row-mapper/builder (`mapImportRow`,
 *   `buildImportRows`) that turns a parsed .xlsx sheet into the backend's
 *   `POST /api/org-structure/nodes/import` request body, plus the dialog's basic
 *   open/file-input/validation/cancel behavior. Mirrors the sibling
 *   `ImportEmployeesDialog.test.tsx` (components/__tests__/) — same mock shape for
 *   use-toast / i18n / queryClient.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

const { apiRequestMock, toastSpy } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(async () => ({ imported: 0, failed: 0, total: 0, created: [], errors: [] })),
  toastSpy: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/lib/queryClient', () => ({
  apiRequest: apiRequestMock,
  queryClient: { invalidateQueries: vi.fn() },
  getAuthHeaders: () => ({}),
}));

import { ImportNodesDialog, mapImportRow, buildImportRows, IMPORT_NODE_COLUMNS, MAX_IMPORT_ROWS } from '../ImportNodesDialog';

describe('mapImportRow — per-row allow-list/coercion (mirrors backend OrgNodeSchema)', () => {
  it('keeps only allow-listed columns and drops unknown ones', () => {
    const out = mapImportRow({ name: 'Bo\'lim A', unknownCol: 'should-be-dropped', nameRu: 'Отдел А' });
    expect(out).toEqual({ name: 'Bo\'lim A', nameRu: 'Отдел А' });
  });

  it('coerces numeric columns (parentId, otdeleniyeNo) to numbers', () => {
    const out = mapImportRow({ name: 'Sex 1', parentId: '5', otdeleniyeNo: '3' });
    expect(out).toEqual({ name: 'Sex 1', parentId: 5, otdeleniyeNo: 3 });
  });

  it('drops a numeric column whose value is not finite', () => {
    const out = mapImportRow({ name: 'Sex 1', parentId: 'not-a-number' });
    expect(out).toEqual({ name: 'Sex 1' });
  });

  it('trims string columns and skips null/undefined/empty values', () => {
    const out = mapImportRow({ name: '  Bo\'lim B  ', code: null, description: undefined, tskp: '' });
    expect(out).toEqual({ name: 'Bo\'lim B' });
  });

  it('returns null when the required "name" column is missing, empty, or whitespace-only', () => {
    expect(mapImportRow({ nameRu: 'Отдел' })).toBeNull();
    expect(mapImportRow({ name: '' })).toBeNull();
    // A raw " " value survives the `v === ""` guard, but String(v).trim() collapses it to
    // an empty string, which the final `out.name.length > 0` check then rejects.
    expect(mapImportRow({ name: '   ' })).toBeNull();
  });

  it('every declared IMPORT_NODE_COLUMN is a recognised key (no typo drift from OrgNodeSchema)', () => {
    expect(IMPORT_NODE_COLUMNS).toContain('name');
    expect(IMPORT_NODE_COLUMNS).toContain('parentId');
    expect(IMPORT_NODE_COLUMNS).toContain('otdeleniyeNo');
  });
});

describe('buildImportRows — sheet-to-request-body builder', () => {
  it('filters out invalid rows (no name) and keeps valid ones', () => {
    const { rows, truncated } = buildImportRows([
      { name: 'A' },
      { nameRu: 'no-name-row' },
      { name: 'B', parentId: '1' },
    ]);
    expect(rows).toEqual([{ name: 'A' }, { name: 'B', parentId: 1 }]);
    expect(truncated).toBe(false);
  });

  it('returns an empty, non-truncated result for a non-array input', () => {
    expect(buildImportRows(undefined)).toEqual({ rows: [], truncated: false });
    expect(buildImportRows(null)).toEqual({ rows: [], truncated: false });
    expect(buildImportRows('not-an-array')).toEqual({ rows: [], truncated: false });
  });

  it('caps rows at MAX_IMPORT_ROWS and flags truncated=true (mirrors backend .max(1000))', () => {
    const raw = Array.from({ length: MAX_IMPORT_ROWS + 5 }, (_, i) => ({ name: `Node ${i}` }));
    const { rows, truncated } = buildImportRows(raw);
    expect(rows).toHaveLength(MAX_IMPORT_ROWS);
    expect(truncated).toBe(true);
  });

  it('skips non-object row entries defensively', () => {
    const { rows } = buildImportRows([{ name: 'Ok' }, null, 42, 'string-row']);
    expect(rows).toEqual([{ name: 'Ok' }]);
  });
});

describe('ImportNodesDialog — component', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('renders dialog title when open is true', () => {
    render(
      <ImportNodesDialog open={true} onClose={vi.fn()} onSuccess={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/Kartalarni import qilish/i)).toBeTruthy();
  });

  it('renders the file input', () => {
    render(
      <ImportNodesDialog open={true} onClose={vi.fn()} onSuccess={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-import-nodes-file')).toBeTruthy();
  });

  it('disables the upload button when no file is selected', () => {
    render(
      <ImportNodesDialog open={true} onClose={vi.fn()} onSuccess={vi.fn()} />,
      { wrapper: TestProviders },
    );
    const upload = screen.getByTestId('button-upload-import-nodes') as HTMLButtonElement;
    expect(upload.disabled).toBe(true);
  });

  it('shows a toast for an invalid (non-.xlsx/.xls) file extension', () => {
    render(
      <ImportNodesDialog open={true} onClose={vi.fn()} onSuccess={vi.fn()} />,
      { wrapper: TestProviders },
    );
    const fileInput = screen.getByTestId('input-import-nodes-file') as HTMLInputElement;
    const badFile = new File(['x'], 'data.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [badFile], writable: false });
    fireEvent.change(fileInput);
    expect(toastSpy).toHaveBeenCalled();
  });

  it('calls onClose when the cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ImportNodesDialog open={true} onClose={onClose} onSuccess={vi.fn()} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-cancel-import-nodes'));
    expect(onClose).toHaveBeenCalled();
  });
});
