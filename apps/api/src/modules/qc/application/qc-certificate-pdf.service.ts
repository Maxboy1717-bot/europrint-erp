/**
 * @module qc-certificate-pdf.service
 * @description T21-A2 (Gap #19) — Sifat sertifikati PDF generatsiya xizmati.
 *
 *   Vazifa:
 *     - Sertifikat raqami SF-<YYYY>-NNNNN ketma-ket (qc_certificate_seq, atomar nextval).
 *     - PDF (pdf-lib): sarlavha, sertifikat meta, lab-test natijalari jadvali,
 *       QR-kod (data-matrix placeholder = scan-mos matn + ramka), imzo joyi.
 *     - Sertifikat yozuvi DB'ga saqlanadi (certificates jadvali — qc_certificates VIEW
 *       ustidan; QcNewRepository.insertCertificate bilan bir xil pattern).
 *
 *   Q-40 / Q-43 (fabrikatsiya-taqiq + real-saqlash): test natijalari REAL qc_lab_tests
 *   dan o'qiladi; SOXTA natija o'ylab topilmaydi. Test bo'lmasa — jadval bo'sh, lekin
 *   sertifikat baribir chiqadi (meta + imzo). Raqam REAL sekvensdan (ketma-ket, takror yo'q).
 *
 * @layer Service (application)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result, safeCall } from '@common/result';

type Row = Record<string, unknown>;

/** Bitta lab-test natijasi (sertifikat jadvalida ko'rsatiladi). */
export interface CertLabTest {
  parameterName: string;
  value: string | null;
  unit: string | null;
  minValue: string | null;
  maxValue: string | null;
  result: string;
}

export interface GenerateCertificateInput {
  /** Buyurtma (sales/papka order) id — lab-testlar shu bo'yicha tortiladi. */
  orderId?: number | null;
  productName?: string | null;
  /** Tashkilot/imzolovchi nomi (PDF imzo bloki). */
  issuedBy?: string | null;
  notes?: string | null;
}

export interface GeneratedCertificate {
  certNumber: string;
  certificateId: number | null;
  pdf: Buffer;
}

@Injectable()
export class QcCertificatePdfService {
  private readonly logger = new Logger(QcCertificatePdfService.name);

  /**
   * Yangi sertifikat raqamini ketma-ket beradi: SF-<YYYY>-NNNNN (NNNNN = 5-xona, nol bilan).
   * qc_certificate_seq — atomar PostgreSQL SEQUENCE (konkurent-xavfsiz, takror yo'q).
   */
  async nextCertificateNumber(): Promise<Result<string>> {
    return safeCall(async () => {
      const r = await db.execute(sql`SELECT nextval('qc_certificate_seq')::bigint AS n`);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      const n = Number(rows[0]?.['n'] ?? 0);
      const year = new Date().getFullYear();
      const seq = String(n).padStart(5, '0');
      return `SF-${year}-${seq}`;
    }, 'DB_ERROR');
  }

  /** Buyurtma bo'yicha real lab-test natijalarini o'qiydi (Q-40 — soxta data yo'q). */
  private async fetchLabTests(orderId?: number | null): Promise<CertLabTest[]> {
    if (!orderId) return [];
    const r = await db.execute(sql`
      SELECT parameter_name, value, unit, min_value, max_value, result
      FROM qc_lab_tests
      WHERE order_id = ${orderId}
      ORDER BY created_at ASC
      LIMIT 200
    `);
    const rows = ((r as { rows?: Row[] }).rows) ?? [];
    return rows.map((row) => ({
      parameterName: String(row['parameter_name'] ?? ''),
      value:    row['value']     != null ? String(row['value'])     : null,
      unit:     row['unit']      != null ? String(row['unit'])      : null,
      minValue: row['min_value'] != null ? String(row['min_value']) : null,
      maxValue: row['max_value'] != null ? String(row['max_value']) : null,
      result:   String(row['result'] ?? 'pending'),
    }));
  }

  /**
   * Sertifikat yozuvini saqlaydi (certificates jadvali — qc_certificates VIEW ustidan).
   * QcNewRepository.insertCertificate bilan bir xil sentinel pattern (user_id=0=QC-origin).
   * Saqlash muvaffaqiyatsiz bo'lsa — PDF baribir chiqadi (certificateId=null).
   */
  private async persistCertificate(
    certNumber: string,
    input: GenerateCertificateInput,
  ): Promise<number | null> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const r = await db.execute(sql`
        INSERT INTO certificates
          (user_id, course_id, certificate_number, cert_number, order_id, product_name, issued_date, status, notes, issued_by)
        VALUES
          (0, 0, ${certNumber}, ${certNumber},
           ${input.orderId ?? null}, ${input.productName ?? null},
           ${today}, 'active', ${input.notes ?? null}, ${input.issuedBy ?? null})
        RETURNING id
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      const id = Number(rows[0]?.['id'] ?? 0);
      return id > 0 ? id : null;
    } catch (e) {
      this.logger.error({ certNumber, error: (e as Error)?.message }, 'Certificate persist failed (PDF still returned)');
      return null;
    }
  }

  /**
   * Sertifikatni TO'LIQ yaratadi: raqam (sekvens) + DB-yozuv + PDF buffer.
   * Atomar emas — raqam har doim ketma-ket; PDF har doim qaytariladi.
   */
  async generate(input: GenerateCertificateInput): Promise<Result<GeneratedCertificate>> {
    const numRes = await this.nextCertificateNumber();
    if (!numRes.ok) return Err(numRes.error);
    const certNumber = numRes.data;

    const labTests = await this.fetchLabTests(input.orderId);
    const certificateId = await this.persistCertificate(certNumber, input);

    return safeCall(async () => {
      const pdf = await this.buildPdf(certNumber, input, labTests, certificateId);
      return { certNumber, certificateId, pdf };
    }, 'INTERNAL');
  }

  // ─── PDF rendering ─────────────────────────────────────────────────────────

  private async buildPdf(
    certNumber: string,
    input: GenerateCertificateInput,
    labTests: CertLabTest[],
    certificateId: number | null,
  ): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const draw = (
      text: string,
      opts?: { x?: number; bold?: boolean; size?: number; color?: ReturnType<typeof rgb> },
    ) => {
      page.drawText(text, {
        x: opts?.x ?? 50,
        y,
        size: opts?.size ?? 11,
        font: opts?.bold ? bold : font,
        color: opts?.color ?? rgb(0, 0, 0),
      });
      y -= (opts?.size ?? 11) + 7;
    };

    // Header
    draw('EuroPrint — Sifat Sertifikati / Quality Certificate', { bold: true, size: 18 });
    page.drawLine({ start: { x: 50, y: y + 4 }, end: { x: 545, y: y + 4 }, thickness: 1.2, color: rgb(0.1, 0.3, 0.6) });
    y -= 12;
    draw(`Sertifikat raqami:  ${certNumber}`, { bold: true, size: 13, color: rgb(0.1, 0.3, 0.6) });
    y -= 4;

    // Meta
    draw(`Buyurtma:    ${input.orderId ?? '-'}`);
    draw(`Mahsulot:    ${input.productName ?? '-'}`);
    draw(`Sana:        ${new Date().toISOString().slice(0, 10)}`);
    draw(`Holat:       Faol / Active`);
    if (input.notes) draw(`Izoh:        ${this.truncate(input.notes, 80)}`);
    y -= 8;

    // Lab test results table
    draw('Sinov natijalari / Test results:', { bold: true, size: 13 });
    y -= 2;
    this.drawTestTable(page, font, bold, labTests, () => y, (ny) => { y = ny; });

    // QR placeholder + signature area on a fixed lower band
    this.drawQrPlaceholder(page, font, certNumber, certificateId);
    this.drawSignatureArea(page, font, bold, input.issuedBy);

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }

  private drawTestTable(
    page: PDFPage,
    font: PDFFont,
    bold: PDFFont,
    tests: CertLabTest[],
    getY: () => number,
    setY: (n: number) => void,
  ): void {
    let y = getY();
    const cols = [50, 200, 290, 360, 470]; // Parameter, Value, Unit, Range, Result
    const headers = ['Parametr', 'Qiymat', 'Birlik', 'Diapazon', 'Natija'];
    headers.forEach((h, i) => page.drawText(h, { x: cols[i], y, size: 9, font: bold, color: rgb(0.3, 0.3, 0.3) }));
    y -= 14;
    page.drawLine({ start: { x: 50, y: y + 4 }, end: { x: 545, y: y + 4 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });

    if (tests.length === 0) {
      page.drawText("Sinov yozuvlari mavjud emas (No lab tests recorded)", { x: 50, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
      y -= 16;
    } else {
      for (const t of tests) {
        if (y < 240) break; // keep clear of the QR/signature band
        const range = t.minValue != null && t.maxValue != null ? `${t.minValue}–${t.maxValue}` : '-';
        const pass = t.result.toLowerCase() === 'pass';
        const cells = [
          this.truncate(t.parameterName, 26),
          t.value ?? '-',
          t.unit ?? '-',
          range,
          t.result.toUpperCase(),
        ];
        cells.forEach((c, i) =>
          page.drawText(String(c), {
            x: cols[i],
            y,
            size: 9,
            font,
            color: i === 4 ? (pass ? rgb(0, 0.5, 0.1) : rgb(0.8, 0, 0)) : rgb(0, 0, 0),
          }),
        );
        y -= 13;
      }
    }
    setY(y);
  }

  /**
   * QR-kod o'rni: haqiqiy QR-kutubxona loyihada yo'q, shuning uchun deterministik
   * data-matrix placeholder (ramka + sertifikat raqami matni — skanerlanadigan/o'qiladigan).
   * Verifikatsiya URL'i matn sifatida beriladi (qo'lda tekshirish uchun).
   */
  private drawQrPlaceholder(page: PDFPage, font: PDFFont, certNumber: string, certificateId: number | null): void {
    const x = 50;
    const yTop = 170;
    const size = 90;
    // Outer frame
    page.drawRectangle({ x, y: yTop - size, width: size, height: size, borderColor: rgb(0, 0, 0), borderWidth: 1.2, color: rgb(1, 1, 1) });
    // Deterministic finder-pattern blocks (3 corners) — QR-ko'rinish placeholder
    const block = size / 7;
    const corners = [
      { cx: x + block, cy: yTop - block * 2 },
      { cx: x + size - block * 2, cy: yTop - block * 2 },
      { cx: x + block, cy: yTop - size + block },
    ];
    for (const c of corners) {
      page.drawRectangle({ x: c.cx, y: c.cy, width: block, height: block, color: rgb(0, 0, 0) });
    }
    page.drawText('QR', { x: x + size / 2 - 8, y: yTop - size / 2 - 4, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`Verify: ${certNumber}`, { x, y: yTop - size - 14, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    if (certificateId != null) {
      page.drawText(`ID: ${certificateId}`, { x, y: yTop - size - 24, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    }
  }

  private drawSignatureArea(page: PDFPage, font: PDFFont, bold: PDFFont, issuedBy?: string | null): void {
    const x = 330;
    const yLine = 110;
    page.drawLine({ start: { x, y: yLine }, end: { x: 545, y: yLine }, thickness: 0.8, color: rgb(0, 0, 0) });
    page.drawText('Imzo / Signature', { x, y: yLine - 14, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(issuedBy ? `Imzolovchi: ${this.truncate(issuedBy, 30)}` : 'Imzolovchi: __________________', {
      x,
      y: yLine - 30,
      size: 9,
      font: bold,
      color: rgb(0, 0, 0),
    });
    page.drawText('M.O. / Stamp', { x, y: yLine - 48, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Hisobot: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`, {
      x: 50,
      y: 40,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  private truncate(s: string, max: number): string {
    return s.length > max ? `${s.slice(0, max - 1)}…` : s;
  }
}
