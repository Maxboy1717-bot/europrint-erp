/**
 * org-razryad-certificate-pdf.service.spec.ts — VISION-3340 #15.
 *
 * RazryadCertificatePdfService mirrors QcCertificatePdfService's structure: it reads
 * directly from `db.execute` (no repository indirection — same exception to Qoida 15
 * that QC's PDF service already carries) and renders a real pdf-lib PDF. `db.execute`
 * is mocked so the service is exercised hermetically (no live DB), following the same
 * pattern as test/mes/lms-cert-expired-block.service.spec.ts. The returned buffer is
 * round-tripped through pdf-lib (structure) and its FlateDecode content streams are
 * inflated + hex `Tj` operands decoded (rendered text) — same technique as
 * test/sd/sd-invoice-pdf.service.spec.ts and test/finance/trial-balance-pdf.service.spec.ts.
 */

type Row = Record<string, unknown>;
const dbExecute = jest.fn();

jest.mock('@shared/db', () => ({
  db: { execute: (...args: unknown[]) => dbExecute(...args) },
}));

import * as zlib from 'zlib';
import { PDFDocument } from 'pdf-lib';
import { isOk, isErr } from '@common/result';
import { RazryadCertificatePdfService } from '../src/modules/org-structure/razryad-certificate-pdf.service';

function wrap(rows: Row[]): { rows: Row[] } {
  return { rows };
}

/**
 * pdf-lib emits page content streams as FlateDecode-compressed, WinAnsi hex-string
 * `Tj` operands (e.g. `<4D6F6C697961> Tj`). Inflates every stream and decodes every
 * hex-string literal back to plain text so assertions can check the *actual rendered
 * text* — not just "is defined".
 */
function extractRenderedText(pdfBytes: Buffer): string {
  const raw = pdfBytes.toString('latin1');
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let decoded = '';
  let streamMatch: RegExpExecArray | null;
  while ((streamMatch = streamRe.exec(raw))) {
    const streamBytes = Buffer.from(streamMatch[1], 'latin1');
    let content: string;
    try {
      content = zlib.inflateSync(streamBytes).toString('latin1');
    } catch {
      content = streamBytes.toString('latin1');
    }
    const hexRe = /<([0-9A-Fa-f]+)>/g;
    let hexMatch: RegExpExecArray | null;
    while ((hexMatch = hexRe.exec(content))) {
      const hex = hexMatch[1];
      let word = '';
      for (let i = 0; i + 1 < hex.length; i += 2) {
        word += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
      }
      decoded += word + '\n';
    }
  }
  return decoded;
}

describe('RazryadCertificatePdfService', () => {
  let svc: RazryadCertificatePdfService;

  beforeEach(() => {
    dbExecute.mockReset();
    svc = new RazryadCertificatePdfService();
  });

  const fullRow: Row = {
    id: 55,
    card_id: 3,
    change_type: 'increase',
    reason: null,
    certificate_number: 'CERT-RZ-3-1720000000000',
    effective_at: '2026-07-01T08:00:00.000Z',
    old_razryad_name: '2-razryad',
    old_level: 2,
    new_razryad_name: '3-razryad',
    new_level: 3,
    card_name: 'Operator (gofra liniya)',
    employee_name: 'Alisher Qodirov',
    approver_name: 'Dilnoza Yusupova',
  };

  it('class is defined and constructible', () => {
    expect(RazryadCertificatePdfService).toBeDefined();
    expect(svc).toBeInstanceOf(RazryadCertificatePdfService);
  });

  it('returns Err(NOT_FOUND) when the history row does not exist', async () => {
    dbExecute.mockResolvedValueOnce(wrap([]));
    const r = await svc.generateForHistory(999);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns Err(DB_ERROR) when the fetch query throws (no fabricated PDF)', async () => {
    dbExecute.mockRejectedValueOnce(new Error('connection refused'));
    const r = await svc.generateForHistory(1);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('DB_ERROR');
  });

  it('queries razryad_history by id (bound param) joined with levels/card/employee/approver', async () => {
    dbExecute.mockResolvedValueOnce(wrap([fullRow]));
    await svc.generateForHistory(55);

    expect(dbExecute).toHaveBeenCalledTimes(1);
    // Drizzle's `sql` tagged template exposes interpolated parts as `queryChunks`:
    // string-literal chunks (`{ value: [...] }`) interleaved with raw bound values.
    const sqlArg = dbExecute.mock.calls[0][0] as { queryChunks: unknown[] };
    expect(sqlArg.queryChunks).toContain(55);
    const literalText = sqlArg.queryChunks
      .filter((c): c is { value: string[] } => typeof c === 'object' && c !== null && 'value' in c)
      .map((c) => c.value.join(''))
      .join('');
    expect(literalText).toContain('FROM razryad_history');
    expect(literalText).toContain('razryad_levels');
    expect(literalText).toContain('org_departments');
  });

  it('returns Ok with a valid, non-empty single-page PDF using the stored certificate number', async () => {
    dbExecute.mockResolvedValueOnce(wrap([fullRow]));
    const r = await svc.generateForHistory(55);
    expect(isOk(r)).toBe(true);
    if (!isOk(r)) return;

    expect(r.data.certNumber).toBe('CERT-RZ-3-1720000000000');
    expect(r.data.historyId).toBe(55);
    const buf = r.data.pdf;
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(200);
    expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    const reloaded = await PDFDocument.load(buf);
    expect(reloaded.getPageCount()).toBe(1);
    const page = reloaded.getPage(0);
    expect(page.getWidth()).toBe(595);
    expect(page.getHeight()).toBe(842);
  });

  it('renders card name, employee name, old->new razryad, certificate number and approver', async () => {
    dbExecute.mockResolvedValueOnce(wrap([fullRow]));
    const r = await svc.generateForHistory(55);
    expect(isOk(r)).toBe(true);
    if (!isOk(r)) return;

    const text = extractRenderedText(r.data.pdf);
    expect(text).toContain('Operator (gofra liniya)');
    expect(text).toContain('Alisher Qodirov');
    expect(text).toContain('2-razryad');
    expect(text).toContain('3-razryad');
    expect(text).toContain('CERT-RZ-3-1720000000000');
    expect(text).toContain('Dilnoza Yusupova');
    expect(text).toContain('2026-07-01');
  });

  it('falls back to a display-only RZ-<id> certificate label when certificate_number is NULL (manual-edit path, Q-40: not persisted)', async () => {
    dbExecute.mockResolvedValueOnce(wrap([{ ...fullRow, certificate_number: null, change_type: 'manual' }]));
    const r = await svc.generateForHistory(55);
    expect(isOk(r)).toBe(true);
    if (!isOk(r)) return;

    expect(r.data.certNumber).toBe('RZ-55');
    const text = extractRenderedText(r.data.pdf);
    expect(text).toContain('RZ-55');
    expect(text).toContain("Qo'lda tahrirlash");
  });

  it('renders "-" / signature placeholder instead of crashing when card, employee or approver names are missing', async () => {
    dbExecute.mockResolvedValueOnce(wrap([{ ...fullRow, card_name: null, employee_name: null, approver_name: null }]));
    const r = await svc.generateForHistory(55);
    expect(isOk(r)).toBe(true);
    if (!isOk(r)) return;

    const text = extractRenderedText(r.data.pdf);
    expect(text).toContain('__________________');
  });

  it('labels a decrease change type distinctly from an increase', async () => {
    dbExecute.mockResolvedValueOnce(wrap([{ ...fullRow, change_type: 'decrease' }]));
    const r = await svc.generateForHistory(55);
    expect(isOk(r)).toBe(true);
    if (!isOk(r)) return;

    const text = extractRenderedText(r.data.pdf);
    expect(text).toContain('Pasayish');
    expect(text).not.toContain("O'sish");
  });
});
