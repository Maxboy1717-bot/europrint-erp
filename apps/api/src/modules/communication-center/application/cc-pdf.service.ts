/**
 * Communication Center — Hujjat PDF generatori
 *
 * Kompaniya blanki + QR kod + imzolar zanjiri bilan rasmiy hujjat PDF.
 * QR kod hujjatning haqiqiyligini autentifikatsiyasiz tekshirish uchun.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import * as QRCode from 'qrcode';

interface DocPdfRow {
  id: string;
  document_number: string;
  subject: string;
  ai_body: string;
  sender_comment: string | null;
  sender_name: string | null;
  template_name_uz: string;
  template_category: string;
  created_at: string;
  workflow_state: string;
  language: 'uz' | 'ru';
}

interface ApprovalRow {
  step_order: number;
  approver_name: string | null;
  state: string;
  signed_at: string | null;
  signature_hash: string | null;
}

@Injectable()
export class CcPdfService {
  private readonly logger = new Logger(CcPdfService.name);

  constructor(private readonly i18n: I18nService) {}

  /**
   * Hujjatdan A4 PDF yaratadi: kompaniya blanki + matn + imzolar + haqiqiy skanerlanadigan QR-rasm.
   * QR ichiga hujjat tekshiruv URL'i (`${baseUrl}/cc/verify/${doc.id}`) kodlangan —
   * `GET /api/cc/verify/:id` (CcPublicController, JWTsiz) shu URL'ni qabul qiladi.
   */
  async generate(documentId: string, baseUrl: string): Promise<Uint8Array> {
    const doc = await this.loadDocument(documentId);
    const approvals = await this.loadApprovals(documentId);

    const pdf  = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const qrUrl = `${baseUrl}/cc/verify/${doc.id}`;
    const qrImage = await this.embedQrCode(pdf, qrUrl);

    const M = 50;
    let y = 800;
    y = this.drawHeader(page, doc, font, bold, M, y);
    y = this.drawBody(page, doc, font, bold, M, y);
    y = this.drawApprovals(page, approvals, font, bold, M, y);
    this.drawFooter(page, doc, qrUrl, qrImage, font, bold, M);

    return await pdf.save();
  }

  /** QR-kod PNG rasmini generatsiya qilib, PDF hujjatiga embed qiladi (ISO/IEC 18004). */
  private async embedQrCode(pdf: PDFDocument, data: string): Promise<PDFImage> {
    const png = await QRCode.toBuffer(data, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 160,
    });
    return pdf.embedPng(png);
  }

  private async loadDocument(documentId: string): Promise<DocPdfRow> {
    const docRes = await runQuery<DocPdfRow>(sql`
      SELECT
        d.id::text                                 AS id,
        d.document_number                          AS document_number,
        d.subject                                  AS subject,
        d.ai_body                                  AS ai_body,
        d.sender_comment                           AS sender_comment,
        NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS sender_name,
        t.name_uz                                  AS template_name_uz,
        t.category                                 AS template_category,
        d.created_at                               AS created_at,
        d.workflow_state                           AS workflow_state,
        d.language                                 AS language
      FROM cc_documents d
      LEFT JOIN cc_document_templates t ON t.id = d.template_id
      LEFT JOIN users u                 ON u.id = d.sender_user_id
      WHERE d.id = ${documentId} LIMIT 1
    `);
    const doc = docRes.rows[0];
    if (!doc) throw new NotFoundException(await this.i18n.t('errors.documentNotFound'));
    return doc;
  }

  private async loadApprovals(documentId: string): Promise<ApprovalRow[]> {
    const apprRes = await runQuery<ApprovalRow>(sql`
      SELECT
        a.step_order,
        NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS approver_name,
        a.state,
        a.signed_at,
        a.signature_hash
      FROM cc_approvals a
      LEFT JOIN users u ON u.id = a.approver_user_id
      WHERE a.document_id = ${documentId}
      ORDER BY a.step_order ASC, a.created_at ASC
    `);
    return apprRes.rows;
  }

  private drawHeader(page: PDFPage, doc: DocPdfRow, font: PDFFont, bold: PDFFont, M: number, y: number): number {
    page.drawText('EUROPRINT', { x: M, y, size: 22, font: bold, color: rgb(0.05, 0.30, 0.85) });
    page.drawText('Karton va qadoqlash mahsulotlari', { x: M, y: y - 18, size: 9, font, color: rgb(0.40, 0.45, 0.55) });
    page.drawText("Qo'qon shahri, O'zbekiston", { x: M, y: y - 30, size: 9, font, color: rgb(0.40, 0.45, 0.55) });

    const dateStr = new Date(doc.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
    page.drawText(`№ ${doc.document_number}`, { x: 400, y, size: 11, font: bold, color: rgb(0.10, 0.15, 0.25) });
    page.drawText(`Sana: ${dateStr}`,         { x: 400, y: y - 15, size: 9, font, color: rgb(0.40, 0.45, 0.55) });

    y -= 50;
    page.drawLine({ start: { x: M, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.85, 0.88, 0.92) });
    return y;
  }

  private drawBody(page: PDFPage, doc: DocPdfRow, font: PDFFont, bold: PDFFont, M: number, y: number): number {
    y -= 25;
    page.drawText(this.transliterate(doc.template_name_uz.toUpperCase()), { x: M, y, size: 13, font: bold, color: rgb(0.10, 0.15, 0.25) });
    y -= 25;
    page.drawText('Mavzu:', { x: M, y, size: 9, font: bold, color: rgb(0.40, 0.45, 0.55) });
    page.drawText(this.transliterate(doc.subject), { x: M + 50, y, size: 11, font, color: rgb(0.10, 0.15, 0.25) });
    y -= 18;
    page.drawText('Yuboruvchi:', { x: M, y, size: 9, font: bold, color: rgb(0.40, 0.45, 0.55) });
    page.drawText(this.transliterate(doc.sender_name ?? "Noma'lum"), { x: M + 70, y, size: 10, font, color: rgb(0.10, 0.15, 0.25) });
    y -= 35;
    y = this.drawWrapped(page, this.transliterate(doc.ai_body), font, M, y, 10, 14, rgb(0.15, 0.20, 0.30));
    if (doc.sender_comment) {
      y -= 10;
      page.drawText('Izoh:', { x: M, y, size: 9, font: bold, color: rgb(0.40, 0.45, 0.55) });
      y -= 14;
      y = this.drawWrapped(page, this.transliterate(doc.sender_comment), font, M, y, 9, 12, rgb(0.30, 0.35, 0.45));
    }
    return y;
  }

  private drawWrapped(
    page: PDFPage, text: string, font: PDFFont, M: number, y: number,
    size: number, lineHeight: number, color: ReturnType<typeof rgb>,
  ): number {
    for (const line of this.wrapText(text, 95)) {
      if (y < 200) break;
      page.drawText(line, { x: M, y, size, font, color });
      y -= lineHeight;
    }
    return y;
  }

  private drawApprovals(page: PDFPage, approvals: ApprovalRow[], font: PDFFont, bold: PDFFont, M: number, y: number): number {
    y = Math.min(y - 30, 250);
    page.drawLine({ start: { x: M, y: y + 8 }, end: { x: 545, y: y + 8 }, thickness: 0.5, color: rgb(0.85, 0.88, 0.92) });
    page.drawText('IMZOLAR ZANJIRI', { x: M, y, size: 9, font: bold, color: rgb(0.40, 0.45, 0.55) });
    y -= 18;

    for (const ap of approvals) {
      if (y < 100) break;
      const stateLabel = ap.state === 'approved' ? '✓ Tasdiqlandi'
                       : ap.state === 'rejected' ? '✗ Rad etildi'
                       : '○ Kutilmoqda';
      const stateColor = ap.state === 'approved' ? rgb(0.10, 0.60, 0.40)
                       : ap.state === 'rejected' ? rgb(0.85, 0.20, 0.20)
                       : rgb(0.50, 0.55, 0.65);
      const signedAt = ap.signed_at ? new Date(ap.signed_at).toLocaleString('uz-UZ') : '—';
      page.drawText(`${ap.step_order}. ${this.transliterate(ap.approver_name ?? 'Noma\'lum')}`, { x: M, y, size: 10, font, color: rgb(0.10, 0.15, 0.25) });
      page.drawText(stateLabel, { x: 280, y, size: 9, font, color: stateColor });
      page.drawText(signedAt,    { x: 410, y, size: 9, font, color: rgb(0.40, 0.45, 0.55) });
      y -= 16;
    }
    return y;
  }

  private drawFooter(
    page: PDFPage, doc: DocPdfRow, qrUrl: string, qrImage: PDFImage,
    font: PDFFont, bold: PDFFont, M: number,
  ): void {
    const qrSize = 70;
    const qrX = 545 - qrSize;
    const qrY = 15;
    const y = qrY + qrSize - 8;

    page.drawLine({ start: { x: M, y: y + 18 }, end: { x: 545, y: y + 18 }, thickness: 0.5, color: rgb(0.85, 0.88, 0.92) });
    page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    page.drawText('Hujjat haqiqiyligini tekshirish:', { x: M, y, size: 8, font: bold, color: rgb(0.40, 0.45, 0.55) });
    page.drawText(qrUrl, { x: M, y: y - 12, size: 7, font, color: rgb(0.20, 0.40, 0.85), maxWidth: qrX - M - 10 });
    page.drawText(`Status: ${doc.workflow_state.toUpperCase()}`, { x: M, y: y - 26, size: 9, font: bold, color: rgb(0.10, 0.15, 0.25) });
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  private wrapText(text: string, maxChars: number): string[] {
    const lines: string[] = [];
    for (const para of text.split(/\n+/)) {
      if (!para.trim()) { lines.push(''); continue; }
      const words = para.split(/\s+/);
      let cur = '';
      for (const w of words) {
        if ((cur + ' ' + w).trim().length > maxChars) {
          if (cur) lines.push(cur);
          cur = w;
        } else {
          cur = (cur ? cur + ' ' : '') + w;
        }
      }
      if (cur) lines.push(cur);
    }
    return lines;
  }

  /** O'zbek lotin transliteratsiya (Helvetica unicode'ni to'liq qo'llab-quvvatlamaydi) */
  private transliterate(text: string): string {
    return text
      .replace(/o'/g, 'o’')
      .replace(/g'/g, 'g’')
      .replace(/'/g, '’');
  }
}
