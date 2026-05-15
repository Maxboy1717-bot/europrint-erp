/**
 * @module export-helpers.test
 * @description Vitest tests for the CSV/JSON/Excel export helpers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportCSV, exportJSON, exportExcel } from '../export-helpers';

interface CapturedBlob {
  type: string;
  parts: BlobPart[];
}

const capturedBlobs: CapturedBlob[] = [];
const OriginalBlob = globalThis.Blob;

class CaptureBlob extends OriginalBlob {
  constructor(parts?: BlobPart[], opts?: BlobPropertyBag) {
    super(parts, opts);
    capturedBlobs.push({ parts: parts ?? [], type: opts?.type ?? '' });
  }
}

beforeEach(() => {
  capturedBlobs.length = 0;
  globalThis.Blob = CaptureBlob as unknown as typeof Blob;
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  vi.spyOn(globalThis, 'alert').mockImplementation(() => undefined);

  // Capture the original (unsuited to spy chaining across tests) by going via
  // Document.prototype, which vi.spyOn does NOT touch.
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

function blobContent(b: CapturedBlob): string {
  return b.parts.map((p) => String(p)).join('');
}

describe('exportCSV', () => {
  it('alerts and skips when data is empty', () => {
    const alertSpy = vi.spyOn(globalThis, 'alert');
    exportCSV('empty', []);
    expect(alertSpy).toHaveBeenCalled();
    expect(capturedBlobs).toHaveLength(0);
  });

  it('produces a CSV blob with header + data rows', () => {
    exportCSV('users', [
      { id: 1, name: 'Ali' },
      { id: 2, name: 'Vali' },
    ]);
    expect(capturedBlobs).toHaveLength(1);
    const csv = blobContent(capturedBlobs[0]);
    expect(csv).toContain('id,name');
    expect(csv).toContain('1,Ali');
    expect(csv).toContain('2,Vali');
  });

  it('escapes values containing commas / quotes / newlines', () => {
    exportCSV('e', [{ a: 'has, comma' }, { a: 'has "quote"' }, { a: 'two\nlines' }]);
    const csv = blobContent(capturedBlobs[0]);
    expect(csv).toContain('"has, comma"');
    expect(csv).toContain('"has ""quote"""');
    expect(csv).toContain('"two\nlines"');
  });

  it('uses custom headers and key selection', () => {
    exportCSV(
      'x',
      [{ id: 1, name: 'a', secret: 's' }],
      { headers: ['ID', 'Name'], keys: ['id', 'name'] },
    );
    const csv = blobContent(capturedBlobs[0]);
    expect(csv).toContain('ID,Name');
    expect(csv).not.toContain('secret');
  });
});

describe('exportJSON', () => {
  it('serialises payload as pretty-printed JSON', () => {
    exportJSON('data', { x: 1 });
    expect(capturedBlobs).toHaveLength(1);
    const json = blobContent(capturedBlobs[0]);
    expect(JSON.parse(json)).toEqual({ x: 1 });
  });

  it('uses application/json content type', () => {
    exportJSON('a', { ok: true });
    expect(capturedBlobs[0].type).toBe('application/json');
  });

  it('does not append .json twice when extension is already supplied', () => {
    exportJSON('a.json', {});
    expect(capturedBlobs[0].parts.length).toBeGreaterThan(0);
  });
});

describe('exportExcel', () => {
  it('alerts and skips when data is empty', () => {
    const alertSpy = vi.spyOn(globalThis, 'alert');
    exportExcel('empty', []);
    expect(alertSpy).toHaveBeenCalled();
    expect(capturedBlobs).toHaveLength(0);
  });

  it('produces an XML blob with the supplied sheet name', () => {
    exportExcel('rep', [{ a: 1 }], { sheetName: 'Sheet9' });
    const xml = blobContent(capturedBlobs[0]);
    expect(xml).toContain('Sheet9');
    expect(xml).toContain('Workbook');
  });

  it('escapes XML-special characters in cell values', () => {
    exportExcel('x', [{ note: '<a>&"\''  }]);
    const xml = blobContent(capturedBlobs[0]);
    expect(xml).toContain('&lt;a&gt;');
    expect(xml).toContain('&amp;');
  });

  it('encodes numeric cells as Number type', () => {
    exportExcel('n', [{ qty: 42 }]);
    const xml = blobContent(capturedBlobs[0]);
    expect(xml).toContain('"Number"');
    expect(xml).toContain('42');
  });
});
