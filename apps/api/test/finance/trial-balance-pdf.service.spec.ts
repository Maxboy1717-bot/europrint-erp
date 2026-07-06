/**
 * test/finance/trial-balance-pdf.service.spec.ts
 *
 * F10 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): "Real financial-statement export."
 * Mirrors test/sd/sd-invoice-pdf.service.spec.ts's precedent: constructs the service directly
 * (no injected deps, pure pdf-lib), round-trips the buffer through pdf-lib to assert real
 * structure, and inflates the FlateDecode content streams to check actual rendered text.
 */
import * as zlib from 'zlib';
import { PDFDocument } from 'pdf-lib';
import { isOk } from '@common/result';
import { TrialBalancePdfService, TrialBalancePdfData } from '../../src/modules/finance/reports/trial-balance-pdf.service';

const NBSP = String.fromCharCode(160);

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
  // uz-UZ locale formats thousands with NBSP (U+00A0) — normalize to a regular space so
  // plain-string toContain() assertions don't need to embed the nbsp literal.
  return decoded.split(NBSP).join(' ');
}

describe('TrialBalancePdfService', () => {
  let svc: TrialBalancePdfService;

  beforeEach(() => {
    svc = new TrialBalancePdfService();
  });

  const baseData: TrialBalancePdfData = {
    fiscalYear: 2026,
    asOfDate: '2026-07-06T00:00:00Z',
    accounts: [
      { accountCode: '1010', accountName: 'Kassa', accountType: 'ASSET', debitBalance: 25000, creditBalance: 0 },
      { accountCode: '6000', accountName: 'Kreditorlar', accountType: 'LIABILITY', debitBalance: 0, creditBalance: 25000 },
    ],
    totals: { debitBalance: 25000, creditBalance: 25000 },
  };

  it('class is defined and constructible', () => {
    expect(TrialBalancePdfService).toBeDefined();
    expect(svc).toBeInstanceOf(TrialBalancePdfService);
  });

  it('returns Ok with a valid, non-empty PDF buffer (A4, single page for a small account list)', async () => {
    const result = await svc.generateTrialBalancePdf(baseData);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const buf = result.data;

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(200);
    expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    const reloaded = await PDFDocument.load(buf);
    expect(reloaded.getPageCount()).toBe(1);
    const page = reloaded.getPage(0);
    expect(page.getWidth()).toBe(595.28);
    expect(page.getHeight()).toBe(841.89);
  });

  it('renders account codes, names and formatted debit/credit amounts', async () => {
    const result = await svc.generateTrialBalancePdf(baseData);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const text = extractRenderedText(result.data);
    expect(text).toContain('1010');
    expect(text).toContain('Kassa');
    expect(text).toContain('6000');
    expect(text).toContain('Kreditorlar');
    expect(text).toContain('25 000,00');
  });

  it('reports BALANSLANGAN when totals match', async () => {
    const result = await svc.generateTrialBalancePdf(baseData);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const text = extractRenderedText(result.data);
    expect(text).toContain('BALANSLANGAN');
  });

  it('reports BALANSSIZ when debit and credit totals diverge (never hides an imbalance)', async () => {
    const result = await svc.generateTrialBalancePdf({
      ...baseData,
      totals: { debitBalance: 30000, creditBalance: 25000 },
    });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const text = extractRenderedText(result.data);
    expect(text).toContain('BALANSSIZ');
    expect(text).not.toContain('BALANSLANGAN');
  });

  it('renders a placeholder row when there are no accounts', async () => {
    const result = await svc.generateTrialBalancePdf({ ...baseData, accounts: [], totals: { debitBalance: 0, creditBalance: 0 } });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const text = extractRenderedText(result.data);
    expect(text).toContain("faol hisoblar topilmadi");
  });

  it('transliterates Cyrillic account names to WinAnsi-safe Latin (no pdf-lib encode crash)', async () => {
    const result = await svc.generateTrialBalancePdf({
      ...baseData,
      accounts: [{ accountCode: '9010', accountName: 'Тушум', accountType: 'REVENUE', debitBalance: 0, creditBalance: 100000 }],
    });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const text = extractRenderedText(result.data);
    expect(text).toContain('Tushum');
    expect(text).not.toMatch(/[Ѐ-ӿ]/);
  });

  it('adds extra pages when the account count overflows a single page', async () => {
    const manyAccounts: TrialBalancePdfData['accounts'] = Array.from({ length: 80 }, (_, i) => ({
      accountCode: String(1000 + i),
      accountName: `Hisob ${i + 1}`,
      accountType: 'ASSET',
      debitBalance: 1000,
      creditBalance: 0,
    }));
    const result = await svc.generateTrialBalancePdf({ ...baseData, accounts: manyAccounts });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const reloaded = await PDFDocument.load(result.data);
    expect(reloaded.getPageCount()).toBeGreaterThan(1);
  });
});
