/**
 * @module export-utils.test
 * @description Vitest tests for exportToCSV / exportToJSON helpers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCSV, exportToJSON } from '../export-utils';

interface CapturedBlob {
  type: string;
  parts: BlobPart[];
}

const blobs: CapturedBlob[] = [];
const OriginalBlob = globalThis.Blob;

class CaptureBlob extends OriginalBlob {
  constructor(parts?: BlobPart[], opts?: BlobPropertyBag) {
    super(parts, opts);
    blobs.push({ parts: parts ?? [], type: opts?.type ?? '' });
  }
}

beforeEach(() => {
  blobs.length = 0;
  globalThis.Blob = CaptureBlob as unknown as typeof Blob;
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

  const origCreate = Document.prototype.createElement;
  vi.spyOn(document, 'createElement').mockImplementation(function (this: Document, tag: string) {
    const el = origCreate.call(this ?? document, tag);
    if (tag === 'a') {
      Object.defineProperty(el, 'click', {
        value: vi.fn(),
        configurable: true,
      });
    }
    return el;
  } as typeof document.createElement);
});

afterEach(() => {
  globalThis.Blob = OriginalBlob;
  vi.restoreAllMocks();
});

function content(b: CapturedBlob): string {
  return b.parts.map((p) => String(p)).join('');
}

describe('exportToCSV', () => {
  it('skips when data array is empty', () => {
    exportToCSV([], 'empty');
    expect(blobs).toHaveLength(0);
  });

  it('skips when data is null-like', () => {
    exportToCSV(null as unknown as Record<string, unknown>[], 'x');
    expect(blobs).toHaveLength(0);
  });

  it('emits a CSV blob with the proper content type', () => {
    exportToCSV([{ id: 1, name: 'A' }], 'r');
    expect(blobs).toHaveLength(1);
    expect(blobs[0].type).toContain('text/csv');
  });

  it('builds header row from object keys when no columns supplied', () => {
    exportToCSV([{ id: 1, name: 'A' }], 'r');
    const csv = content(blobs[0]);
    expect(csv).toContain('id,name');
  });

  it('honours custom columns option (key + label)', () => {
    exportToCSV(
      [{ id: 1, name: 'A', hidden: 'x' }],
      'r',
      [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
    );
    const csv = content(blobs[0]);
    expect(csv).toContain('ID,Name');
    expect(csv).not.toContain('hidden');
  });

  it('escapes commas/quotes/newlines in values', () => {
    exportToCSV(
      [{ a: 'has,comma' }, { a: 'has "quote"' }, { a: 'multi\nline' }],
      'r',
    );
    const csv = content(blobs[0]);
    expect(csv).toContain('"has,comma"');
    expect(csv).toContain('"has ""quote"""');
  });

  it('emits BOM for Excel compatibility', () => {
    exportToCSV([{ a: 1 }], 'r');
    const csv = content(blobs[0]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
});

describe('exportToJSON', () => {
  it('emits a JSON blob with proper content type', () => {
    exportToJSON({ ok: true }, 'data');
    expect(blobs).toHaveLength(1);
    expect(blobs[0].type).toBe('application/json');
  });

  it('produces parseable JSON', () => {
    exportToJSON({ a: 1, b: 'x' }, 'data');
    const text = content(blobs[0]);
    expect(JSON.parse(text)).toEqual({ a: 1, b: 'x' });
  });

  it('handles array payloads', () => {
    exportToJSON([1, 2, 3], 'data');
    const text = content(blobs[0]);
    expect(JSON.parse(text)).toEqual([1, 2, 3]);
  });

  it('pretty-prints with 2-space indent', () => {
    exportToJSON({ a: 1 }, 'data');
    const text = content(blobs[0]);
    expect(text).toContain('\n');
    expect(text).toContain('  ');
  });
});
