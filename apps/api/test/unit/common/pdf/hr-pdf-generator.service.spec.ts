/**
 * Behavioral spec for HrPdfGeneratorService (Rule 22: every service needs a unit test).
 *
 * The service has no injected dependencies (pure pdf-lib usage), so it is
 * constructed directly and exercised end-to-end: real PDF bytes are produced,
 * re-parsed with pdf-lib to assert on structure (page count/size), and the
 * FlateDecode-compressed content streams are inflated + the hex-encoded
 * `Tj` text operands decoded so assertions can check the *actual rendered
 * text* (defect-rate calculation, conditional colouring, currency
 * formatting) — not just "is defined".
 */
import * as zlib from 'zlib';
import { PDFDocument } from 'pdf-lib';
import { HrPdfGeneratorService } from '../../../../src/common/pdf/hr-pdf-generator.service';

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

describe('HrPdfGeneratorService', () => {
  let svc: HrPdfGeneratorService;

  beforeEach(() => {
    svc = new HrPdfGeneratorService();
  });

  it('class is defined and constructible', () => {
    expect(HrPdfGeneratorService).toBeDefined();
    expect(svc).toBeInstanceOf(HrPdfGeneratorService);
  });

  describe('generateOperatorInvoice', () => {
    const basePayload = {
      fullName: 'Alisher Qodirov',
      positionName: 'Operator',
      machineName: 'Gofra-1',
      periodStart: new Date('2026-06-01T08:00:00Z'),
      periodEnd: new Date('2026-06-01T16:00:00Z'),
      unitsProduced: 200,
      unitsDefective: 20,
      hourlyRate: 15000,
      posDebtUzs: 0,
    };

    it('returns a valid, non-empty PDF buffer (A4, single page)', async () => {
      const buf = await svc.generateOperatorInvoice(basePayload);

      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(200);
      // PDF magic header
      expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-');

      // Round-trip through pdf-lib to assert real structure, not just bytes.
      const reloaded = await PDFDocument.load(buf);
      expect(reloaded.getPageCount()).toBe(1);
      const page = reloaded.getPage(0);
      expect(page.getWidth()).toBe(595);
      expect(page.getHeight()).toBe(842);
    });

    it('computes and renders the defect rate (20/200 = 10.0%)', async () => {
      const buf = await svc.generateOperatorInvoice(basePayload);
      const text = extractRenderedText(buf);

      expect(text).toContain('10.0%');
      expect(text).toContain('Alisher Qodirov');
      expect(text).toContain('200 dona');
    });

    it('guards against division-by-zero when unitsProduced is 0 (defect rate = 0.0%)', async () => {
      const buf = await svc.generateOperatorInvoice({
        ...basePayload,
        unitsProduced: 0,
        unitsDefective: 0,
      });
      const text = extractRenderedText(buf);

      expect(text).toContain('0.0%');
      expect(text).not.toContain('NaN');
      expect(text).not.toContain('Infinity');
    });

    it('renders the POS debt line only when posDebtUzs is negative', async () => {
      const withDebt = await svc.generateOperatorInvoice({ ...basePayload, posDebtUzs: -50000 });
      const withoutDebt = await svc.generateOperatorInvoice({ ...basePayload, posDebtUzs: 0 });

      expect(extractRenderedText(withDebt)).toContain('POS qarz');
      expect(extractRenderedText(withoutDebt)).not.toContain('POS qarz');
    });
  });

  describe('generateMonthlyCard', () => {
    const basePayload = {
      fullName: 'Nodira Karimova',
      positionName: 'Buxgalter',
      departmentName: 'Moliya',
      year: 2026,
      month: 6,
      daysPresent: 20,
      daysLate: 1,
      daysAbsent: 0,
      bonusUzs: 500000,
      fineUzs: 0,
      abcCategory: 'A',
      posBalance: 100000,
      netSalaryUzs: 4500000,
    };

    it('returns a valid, non-empty PDF buffer (A4, single page)', async () => {
      const buf = await svc.generateMonthlyCard(basePayload);

      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-');

      const reloaded = await PDFDocument.load(buf);
      expect(reloaded.getPageCount()).toBe(1);
      const page = reloaded.getPage(0);
      expect(page.getWidth()).toBe(595);
      expect(page.getHeight()).toBe(842);
    });

    it('formats the net salary with thousands separators', async () => {
      const buf = await svc.generateMonthlyCard(basePayload);
      const text = extractRenderedText(buf);

      expect(text).toContain('4,500,000');
      expect(text).toContain('Nodira Karimova');
      expect(text).toContain('6/2026');
    });

    it('falls back to "Belgilanmagan" when abcCategory is null', async () => {
      const buf = await svc.generateMonthlyCard({ ...basePayload, abcCategory: null });
      expect(extractRenderedText(buf)).toContain('Belgilanmagan');
    });
  });
});
