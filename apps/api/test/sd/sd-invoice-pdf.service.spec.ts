/**
 * Behavioral spec for SdInvoicePdfService (Rule 22: every service needs a unit test).
 *
 * The service has no injected dependencies (pure pdf-lib usage), so it is
 * constructed directly and exercised end-to-end: `generateInvoicePdf()` is
 * called with plain `InvoicePdfData` and the returned `Result<Buffer>` is
 * unwrapped, re-parsed with pdf-lib to assert on structure (page count/size),
 * and the FlateDecode-compressed content streams are inflated + the
 * hex-encoded `Tj` text operands decoded so assertions can check the *actual
 * rendered text* — not just "is defined". This mirrors the precedent in
 * test/unit/common/pdf/hr-pdf-generator.service.spec.ts.
 */
import * as zlib from 'zlib';
import { PDFDocument } from 'pdf-lib';
import { isOk } from '@common/result';
import { SdInvoicePdfService, InvoicePdfData } from '@modules/sd/invoices/sd-invoice-pdf.service';

/**
 * pdf-lib emits page content streams as FlateDecode-compressed, WinAnsi
 * hex-string `Tj` operands (e.g. `<4D6F6C697961> Tj`). This inflates every
 * stream in the PDF and decodes every hex-string literal back to plain text
 * so the test can assert on what will actually be visible on the page.
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

describe('SdInvoicePdfService', () => {
  let svc: SdInvoicePdfService;

  beforeEach(() => {
    svc = new SdInvoicePdfService();
  });

  it('class is defined and constructible', () => {
    expect(SdInvoicePdfService).toBeDefined();
    expect(svc).toBeInstanceOf(SdInvoicePdfService);
  });

  const baseData: InvoicePdfData = {
    invoiceNumber: 'INV-2026-0001',
    customerName: 'Alisher Qodirov',
    status: 'paid',
    createdAt: new Date('2026-06-01T08:00:00Z'),
    dueDate: new Date('2026-06-15T08:00:00Z'),
    subtotal: 1000000,
    taxAmount: 120000,
    totalAmount: 1120000,
    paidAmount: 1120000,
    notes: null,
    lines: [
      { name: 'Gofra karton quti', quantity: 100, unitPrice: 5000, taxRate: 12 },
      { name: 'Offset qadoq', quantity: 50, unitPrice: 8000, taxRate: 12 },
    ],
  };

  it('returns Ok with a valid, non-empty PDF buffer (A4, single page)', async () => {
    const result = await svc.generateInvoicePdf(baseData);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const buf = result.data;

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(200);
    // PDF magic header
    expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    // Round-trip through pdf-lib to assert real structure, not just bytes.
    const reloaded = await PDFDocument.load(buf);
    expect(reloaded.getPageCount()).toBe(1);
    const page = reloaded.getPage(0);
    expect(page.getWidth()).toBe(595.28);
    expect(page.getHeight()).toBe(841.89);
  });

  it('renders invoice number, customer name and translated status label', async () => {
    const result = await svc.generateInvoicePdf(baseData);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const text = extractRenderedText(result.data);
    expect(text).toContain('INV-2026-0001');
    expect(text).toContain('Alisher Qodirov');
    // status 'paid' -> STATUS_LABEL uz translation, not the raw key
    expect(text).toContain("To'langan");
    expect(text).not.toContain('paid');
  });

  it('computes each line total as quantity * unitPrice * (1 + taxRate/100) and formats totals', async () => {
    const result = await svc.generateInvoicePdf(baseData);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const text = extractRenderedText(result.data);
    // _fmtMoney uses uz-UZ locale: U+00A0 (nbsp) thousands separator, comma decimals.
    // line 1: 100 * 5000 * 1.12 = 560 000,00
    expect(text).toContain('560 000,00');
    // line 2: 50 * 8000 * 1.12 = 448 000,00
    expect(text).toContain('448 000,00');
    // JAMI / totalAmount formatted with 2 decimals + thousands separators
    expect(text).toContain('1 120 000,00');
  });

  it('falls back to a placeholder for missing dates instead of crashing or emitting NaN/Invalid', async () => {
    const result = await svc.generateInvoicePdf({ ...baseData, createdAt: null, dueDate: null });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const text = extractRenderedText(result.data);
    // _fmtDate returns '—' (em dash, U+2014) for missing dates, but toPdfSafeText's
    // belt-and-suspenders (any codepoint > 0xFF) rewrites it to '?' before rendering —
    // this pins that real, observed behaviour rather than the ideal one.
    expect(text).toContain('Sana / Data:  ?');
    expect(text).toContain('Srok:  ?');
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('Invalid');
  });

  it('falls back to the same placeholder for an unparsable date string', async () => {
    const result = await svc.generateInvoicePdf({ ...baseData, createdAt: 'not-a-date' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const text = extractRenderedText(result.data);
    expect(text).toContain('Sana / Data:  ?');
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('Invalid');
  });

  it('renders a placeholder row when there are no invoice lines', async () => {
    const result = await svc.generateInvoicePdf({ ...baseData, lines: [] });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const text = extractRenderedText(result.data);
    expect(text).toContain("hisob-faktura qatorlari yo'q");
  });

  it('transliterates Cyrillic customer name and notes to WinAnsi-safe Latin (no pdf-lib encode crash)', async () => {
    const result = await svc.generateInvoicePdf({
      ...baseData,
      customerName: 'Мирзаев Шерзод',
      notes: 'Тезкор етказиб бериш керак',
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const text = extractRenderedText(result.data);
    // Transliterated Latin forms should be present; raw Cyrillic must not be
    // (pdf-lib WinAnsi standard fonts cannot encode Cyrillic at all). Multi-char
    // digraphs (Ш -> sh) are fully upper-cased for an uppercase source letter,
    // hence "SHerzod" rather than title-case "Sherzod" — pinning real behaviour.
    expect(text).toContain('Mirzaev SHerzod');
    expect(text).toContain('Tezkor');
    expect(text).not.toMatch(/[Ѐ-ӿ]/);
  });

  it('truncates an overly long note instead of overflowing the page', async () => {
    const longNote = 'A'.repeat(200);
    const result = await svc.generateInvoicePdf({ ...baseData, notes: longNote });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const text = extractRenderedText(result.data);
    // _truncate appends '…' (U+2026), which toPdfSafeText's belt-and-suspenders
    // (codepoint > 0xFF) rewrites to '?' before rendering — same real behaviour
    // pinned as the date-placeholder case above.
    expect(text).toContain('A'.repeat(89) + '?');
    expect(text).not.toContain('A'.repeat(200));
  });

  it('adds extra pages when the line count overflows a single page', async () => {
    const manyLines: InvoicePdfData['lines'] = Array.from({ length: 60 }, (_, i) => ({
      name: `Mahsulot ${i + 1}`,
      quantity: 1,
      unitPrice: 1000,
      taxRate: 0,
    }));
    const result = await svc.generateInvoicePdf({ ...baseData, lines: manyLines });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const reloaded = await PDFDocument.load(result.data);
    expect(reloaded.getPageCount()).toBeGreaterThan(1);
  });
});
