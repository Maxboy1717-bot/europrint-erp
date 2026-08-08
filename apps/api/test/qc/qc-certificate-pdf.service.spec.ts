/**
 * test/qc/qc-certificate-pdf.service.spec.ts — VISION-3340 #36.
 *
 * QcCertificatePdfService reads directly from `db.execute` (no repository
 * indirection — same Qoida 15 exception the module already carries) and
 * renders a real pdf-lib PDF. `db.execute` is mocked so the service is
 * exercised hermetically (no live DB) — same pattern as
 * test/org-razryad-certificate-pdf.service.spec.ts. The returned buffer is
 * round-tripped through pdf-lib (structure) and its FlateDecode content
 * streams are inflated + hex `Tj` operands decoded (rendered text) — same
 * technique as test/sd/sd-invoice-pdf.service.spec.ts.
 *
 * Covers the #36 fix specifically: the fake QR rectangle is gone and a real
 * embedded PNG image (via `qrcode` + `pdf.embedPng`, mirroring
 * cc-pdf.service.ts#embedQrCode) is drawn instead, and uz/en-only labels are
 * now uz/ru/en trilingual (ru transliterated via `toPdfSafeText`, since
 * pdf-lib StandardFonts/WinAnsi cannot encode Cyrillic).
 */

type Row = Record<string, unknown>;
// Prefixed `mock*` so babel-plugin-jest-hoist permits referencing it inside the
// (hoisted) jest.mock() factory below — see the sibling pattern this file mirrors.
const mockDbExecute = jest.fn();

jest.mock('@shared/db', () => ({
  db: { execute: (...args: unknown[]) => mockDbExecute(...args) },
}));

import * as zlib from 'zlib';
import { PDFDocument } from 'pdf-lib';
import { isOk, isErr } from '@common/result';
import { QcCertificatePdfService, GenerateCertificateInput } from '../../src/modules/qc/application/qc-certificate-pdf.service';

function wrap(rows: Row[]): { rows: Row[] } {
  return { rows };
}

/**
 * pdf-lib emits page content streams as FlateDecode-compressed, WinAnsi
 * hex-string `Tj` operands (e.g. `<4D6F6C697961> Tj`). Inflates every
 * stream and decodes every hex-string literal back to plain text so
 * assertions can check the *actual rendered text* — not just "is defined".
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

describe('QcCertificatePdfService', () => {
  let svc: QcCertificatePdfService;

  beforeEach(() => {
    mockDbExecute.mockReset();
    svc = new QcCertificatePdfService();
  });

  const input: GenerateCertificateInput = {
    orderId: 42,
    productName: 'Gofra karton quti',
    issuedBy: 'Dilnoza Yusupova',
    notes: null,
  };

  const labTests: Row[] = [
    { parameter_name: 'Qalinlik', value: '3.2', unit: 'mm', min_value: '3.0', max_value: '3.5', result: 'pass' },
    { parameter_name: 'Namlik', value: '12', unit: '%', min_value: '8', max_value: '10', result: 'fail' },
  ];

  it('class is defined and constructible', () => {
    expect(QcCertificatePdfService).toBeDefined();
    expect(svc).toBeInstanceOf(QcCertificatePdfService);
  });

  describe('nextCertificateNumber', () => {
    it('formats SF-<year>-NNNNN from the real qc_certificate_seq nextval', async () => {
      mockDbExecute.mockResolvedValueOnce(wrap([{ n: 7 }]));
      const r = await svc.nextCertificateNumber();
      expect(isOk(r)).toBe(true);
      if (!isOk(r)) return;
      expect(r.data).toBe(`SF-${new Date().getFullYear()}-00007`);
    });

    it('returns Err(DB_ERROR) when the sequence query throws (no fabricated number)', async () => {
      mockDbExecute.mockRejectedValueOnce(new Error('connection refused'));
      const r = await svc.nextCertificateNumber();
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe('DB_ERROR');
    });
  });

  describe('generate', () => {
    it('returns Err without touching lab-tests/persist when the certificate sequence fails', async () => {
      mockDbExecute.mockRejectedValueOnce(new Error('connection refused'));
      const r = await svc.generate(input);
      expect(isErr(r)).toBe(true);
      // nextCertificateNumber's single call is the only db.execute invocation.
      expect(mockDbExecute).toHaveBeenCalledTimes(1);
    });

    it('returns Ok with a valid, non-empty single-page A4 PDF and the real cert number', async () => {
      mockDbExecute
        .mockResolvedValueOnce(wrap([{ n: 12 }])) // nextval
        .mockResolvedValueOnce(wrap(labTests)) // fetchLabTests
        .mockResolvedValueOnce(wrap([{ id: 501 }])); // persistCertificate INSERT

      const r = await svc.generate(input);
      expect(isOk(r)).toBe(true);
      if (!isOk(r)) return;

      expect(r.data.certNumber).toBe(`SF-${new Date().getFullYear()}-00012`);
      expect(r.data.certificateId).toBe(501);
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

    it('still returns Ok with certificateId=null when persistCertificate fails (PDF always returned)', async () => {
      // orderId=null short-circuits fetchLabTests before any db.execute call
      // (fetchLabTests returns [] synchronously), so only 2 calls happen:
      // nextval, then the failing persistCertificate INSERT.
      mockDbExecute
        .mockResolvedValueOnce(wrap([{ n: 13 }])) // nextval
        .mockRejectedValueOnce(new Error('unique violation')); // persistCertificate INSERT throws

      const r = await svc.generate({ ...input, orderId: null });
      expect(isOk(r)).toBe(true);
      if (!isOk(r)) return;
      expect(r.data.certificateId).toBeNull();
    });

    it('embeds a real scannable QR PNG image instead of the old fake vector rectangle', async () => {
      mockDbExecute
        .mockResolvedValueOnce(wrap([{ n: 21 }]))
        .mockResolvedValueOnce(wrap([]))
        .mockResolvedValueOnce(wrap([{ id: 1 }]));

      const r = await svc.generate(input);
      expect(isOk(r)).toBe(true);
      if (!isOk(r)) return;

      // A real embedded raster image is written as an XObject with
      // /Subtype /Image in the object dictionary (cleartext, not inside a
      // compressed content stream) — the old placeholder drew only vector
      // `re`/`f` rectangle operators inside the page content stream, never
      // an Image XObject.
      const raw = r.data.pdf.toString('latin1');
      expect(raw).toContain('/Subtype /Image');
      expect(raw).toContain('/Type /XObject');

      // Round-trips cleanly through pdf-lib (proves it's a valid embedded image).
      const reloaded = await PDFDocument.load(r.data.pdf);
      expect(reloaded.getPageCount()).toBe(1);
    });

    it('renders trilingual (uz/ru/en) header, meta and QR/signature labels', async () => {
      mockDbExecute
        .mockResolvedValueOnce(wrap([{ n: 30 }]))
        .mockResolvedValueOnce(wrap(labTests))
        .mockResolvedValueOnce(wrap([{ id: 2 }]));

      const r = await svc.generate(input);
      expect(isOk(r)).toBe(true);
      if (!isOk(r)) return;

      const text = extractRenderedText(r.data.pdf);

      // Header: uz + ru (transliterated) + en all present.
      expect(text).toContain('Sifat Sertifikati');
      expect(text).toContain('Sertifikat kachestva');
      expect(text).toContain('Quality Certificate');

      // Meta labels: uz / ru (transliterated) / en.
      expect(text).toContain('Nomer sertifikata');
      expect(text).toContain('Zakaz');
      expect(text).toContain('Produkt');
      expect(text).toContain('Data');
      expect(text).toContain('Status');
      expect(text).toContain('Aktiven');

      // Test-results section + table header row (ru, transliterated).
      expect(text).toContain('Rezultaty ispytaniy');
      expect(text).toContain('Parametr');
      expect(text).toContain('Znachenie');
      expect(text).toContain('Edinitsa');
      expect(text).toContain('Diapazon');
      expect(text).toContain('Rezultat');

      // QR verify + signature block labels (uz/ru/en).
      expect(text).toContain('Proverka');
      expect(text).toContain('Podpis');
      expect(text).toContain('Podpisal');
      expect(text).toContain('Pechat');
      expect(text).toContain('Otchyot');

      // Cyrillic itself must never reach page.drawText (WinAnsi can't encode it).
      expect(text).not.toMatch(/[Ѐ-ӿ]/);
    });

    it('renders the trilingual "no lab tests" placeholder when the order has no lab_tests rows', async () => {
      mockDbExecute
        .mockResolvedValueOnce(wrap([{ n: 40 }]))
        .mockResolvedValueOnce(wrap([]))
        .mockResolvedValueOnce(wrap([{ id: 3 }]));

      const r = await svc.generate(input);
      expect(isOk(r)).toBe(true);
      if (!isOk(r)) return;

      const text = extractRenderedText(r.data.pdf);
      expect(text).toContain('Sinov yozuvlari mavjud emas');
      expect(text).toContain('Zapisi ispytaniy otsutstvuyut');
      expect(text).toContain('No lab tests recorded');
    });

    it('renders real (non-fabricated) lab test rows with PASS/FAIL results', async () => {
      mockDbExecute
        .mockResolvedValueOnce(wrap([{ n: 50 }]))
        .mockResolvedValueOnce(wrap(labTests))
        .mockResolvedValueOnce(wrap([{ id: 4 }]));

      const r = await svc.generate(input);
      expect(isOk(r)).toBe(true);
      if (!isOk(r)) return;

      const text = extractRenderedText(r.data.pdf);
      expect(text).toContain('Qalinlik');
      expect(text).toContain('Namlik');
      expect(text).toContain('PASS');
      expect(text).toContain('FAIL');
    });
  });
});
