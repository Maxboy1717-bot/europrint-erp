/**
 * @module lms-certificate-pdf.service
 * @description Item #64 — LMS certificate download was HTML, not a real PDF. This service
 *   mirrors the PDF-builder pattern already built twice in this codebase (QcCertificatePdfService
 *   for QC product certs, RazryadCertificatePdfService for grade-change certs — the latter's own
 *   comment says it "mirrors QC pattern") — same pdf-lib + qrcode + toPdfSafeText() structure, a
 *   third time for LMS training certs. No new business rule: cert_hash/issued_ip (the "digital
 *   signature" substitute, Q-35-approved migration lms-certificate-legal-fields-2026-07-11.sql)
 *   are already computed and written by both LMS write paths
 *   (drizzle-lms-cert.repo.ts / drizzle-lms-courses-extended.repo.ts) — this only renders them.
 *
 *   pdf-lib StandardFonts (WinAnsi) cannot encode Cyrillic — every drawn string goes through
 *   toPdfSafeText() (same reason as the QC/Razryad services: a Cyrillic employee name would
 *   otherwise crash with "WinAnsi cannot encode").
 * @layer Service (application)
 */

import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFImage } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result, AppErr, safeCall } from '@common/result';
import { toPdfSafeText } from '@common/pdf/pdf-safe-text.helper';

type Row = Record<string, unknown>;

export interface LmsCertificateRow {
  id: number;
  certificateNumber: string;
  holderName: string | null;
  holderPosition: string | null;
  courseTitle: string | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
  status: string | null;
  issuedIp: string | null;
  certHash: string | null;
  issuedBy: string | null;
}

export interface GeneratedLmsCertificate {
  certNumber: string;
  pdf: Buffer;
}

@Injectable()
export class LmsCertificatePdfService {
  private async fetchRow(id: number): Promise<LmsCertificateRow | null> {
    const r = await rawSql(sql`
      SELECT cert.id, COALESCE(cert.certificate_number, cert.cert_number, cert.id::text) AS certificate_number,
             NULLIF(TRIM(COALESCE(emp.first_name, '') || ' ' || COALESCE(emp.last_name, '')), '') AS holder_name,
             emp.position AS holder_position,
             c.title_uz AS course_title,
             COALESCE(cert.issued_at, cert.issued_date) AS issued_at,
             cert.expiry_date AS expires_at, cert.status,
             cert.issued_ip, cert.cert_hash, cert.issued_by
      FROM certificates cert
      LEFT JOIN employees emp ON emp.id = cert.employee_id
      LEFT JOIN courses c ON c.id = cert.course_id
      WHERE cert.id = ${id}
      LIMIT 1
    `);
    const row = ((r as { rows?: Row[] }).rows ?? [])[0];
    if (!row) return null;
    return {
      id: Number(row['id']),
      certificateNumber: String(row['certificate_number']),
      holderName: row['holder_name'] != null ? String(row['holder_name']) : null,
      holderPosition: row['holder_position'] != null ? String(row['holder_position']) : null,
      courseTitle: row['course_title'] != null ? String(row['course_title']) : null,
      issuedAt: row['issued_at'] ? new Date(String(row['issued_at'])) : null,
      expiresAt: row['expires_at'] ? new Date(String(row['expires_at'])) : null,
      status: row['status'] != null ? String(row['status']) : null,
      issuedIp: row['issued_ip'] != null ? String(row['issued_ip']) : null,
      certHash: row['cert_hash'] != null ? String(row['cert_hash']) : null,
      issuedBy: row['issued_by'] != null ? String(row['issued_by']) : null,
    };
  }

  async generateForCertificate(id: number): Promise<Result<GeneratedLmsCertificate>> {
    const row = await safeCall(() => this.fetchRow(id), 'DB_ERROR');
    if (!row.ok) return Err(row.error);
    if (!row.data) return Err(AppErr('NOT_FOUND', `Sertifikat #${id} topilmadi`));

    return safeCall(async () => {
      const pdf = await this.buildPdf(row.data as LmsCertificateRow);
      return { certNumber: row.data!.certificateNumber, pdf };
    }, 'INTERNAL');
  }

  // ─── PDF rendering (QC / Razryad certificate PDF-builder pattern) ─────────

  private async buildPdf(row: LmsCertificateRow): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    // QR encodes cert_hash when present (the digital-signature substitute), else the plain
    // certificate number — no fabricated external verification URL exists (Q-40).
    const qrPayload = row.certHash ?? row.certificateNumber;
    const qrImage = await this.embedQrCode(pdf, qrPayload);

    let y = 800;
    const draw = (
      text: string,
      opts?: { x?: number; bold?: boolean; size?: number; color?: ReturnType<typeof rgb> },
    ) => {
      page.drawText(toPdfSafeText(text), {
        x: opts?.x ?? 50,
        y,
        size: opts?.size ?? 11,
        font: opts?.bold ? bold : font,
        color: opts?.color ?? rgb(0, 0, 0),
      });
      y -= (opts?.size ?? 11) + 7;
    };

    draw('EuroPrint — LMS Sertifikati / Training Certificate', { bold: true, size: 18 });
    page.drawLine({ start: { x: 50, y: y + 4 }, end: { x: 545, y: y + 4 }, thickness: 1.2, color: rgb(0.1, 0.3, 0.6) });
    y -= 12;
    draw(`Sertifikat raqami:  ${row.certificateNumber}`, { bold: true, size: 13, color: rgb(0.1, 0.3, 0.6) });
    y -= 4;

    draw(`Xodim:        ${row.holderName ?? '-'}`);
    if (row.holderPosition) draw(`Lavozim:      ${row.holderPosition}`);
    draw(`Kurs:         ${row.courseTitle ?? '-'}`);
    draw(`Berilgan sana:${row.issuedAt ? row.issuedAt.toISOString().slice(0, 10) : '-'}`);
    draw(`Amal muddati: ${row.expiresAt ? row.expiresAt.toISOString().slice(0, 10) : '-'}`);
    draw(`Holati:       ${row.status ?? '-'}`);
    if (row.issuedIp) draw(`Chiqargan IP: ${row.issuedIp}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
    y -= 8;

    this.drawQrCode(page, font, qrImage, row.certificateNumber);
    this.drawSignatureArea(page, font, bold, row.issuedBy);

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }

  private async embedQrCode(pdf: PDFDocument, payload: string): Promise<PDFImage> {
    const png = await QRCode.toBuffer(payload, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 160,
    });
    return pdf.embedPng(png);
  }

  private drawQrCode(page: PDFPage, font: PDFFont, qrImage: PDFImage, certNumber: string): void {
    const x = 50;
    const yTop = 170;
    const size = 90;
    page.drawImage(qrImage, { x, y: yTop - size, width: size, height: size });
    page.drawText(toPdfSafeText(`Verify: ${certNumber}`), { x, y: yTop - size - 14, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
  }

  private drawSignatureArea(page: PDFPage, font: PDFFont, bold: PDFFont, issuedBy?: string | null): void {
    const x = 330;
    const yLine = 110;
    page.drawLine({ start: { x, y: yLine }, end: { x: 545, y: yLine }, thickness: 0.8, color: rgb(0, 0, 0) });
    page.drawText(toPdfSafeText('Imzo / Signature'), { x, y: yLine - 14, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(
      toPdfSafeText(issuedBy ? `Chiqargan: ${this.truncate(issuedBy, 30)}` : 'Tasdiqlovchi: __________________'),
      { x, y: yLine - 30, size: 9, font: bold, color: rgb(0, 0, 0) },
    );
    page.drawText(toPdfSafeText('M.O. / Stamp'), { x, y: yLine - 48, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(toPdfSafeText(`Hisobot: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`), {
      x: 50, y: 40, size: 8, font, color: rgb(0.5, 0.5, 0.5),
    });
  }

  private truncate(s: string, max: number): string {
    return s.length > max ? `${s.slice(0, max - 1)}…` : s;
  }
}
