/**
 * @module razryad-certificate-pdf.service
 * @description VISION-3340 #15 — Razryad o'sish/pasayish sertifikati PDF generatsiya xizmati.
 *   Muammo: `razryad_history.certificate_number` bugun oddiy matn qator (masalan
 *   `CERT-RZ-<cardId>-<timestamp>`) — bosib chiqarish/yuklab olish mumkin bo'lgan hujjat
 *   YO'Q, QC modulidagi sertifikat PDF pattern'idan farqli o'laroq (Gap #19,
 *   `qc-certificate-pdf.service.ts`). Bu xizmat AYNAN o'sha struktura/PDF-builder
 *   naqshini takrorlaydi (draw() yopilishi, sarlavha, meta bloklar, QR-o'rin,
 *   imzo maydoni) — faqat mazmuni razryad o'zgarishi uchun mos: karta nomi, xodim
 *   ismi, eski razryad -> yangi razryad, sertifikat raqami, tasdiqlovchi, sana.
 *
 *   Ma'lumot manbai: `razryad_history` (immutable, EP-ORG-010..013/067/070) — bitta
 *   tarix yozuvi bo'yicha JOIN orqali karta/xodim/razryad/tasdiqlovchi nomlari
 *   o'qiladi (QC'ning `fetchLabTests`/`persistCertificate` bilan bir xil to'g'ridan
 *   `db.execute` naqshi — Qoida 15'ning QC PDF-xizmatida allaqachon mavjud istisnosi).
 *   Sertifikat raqami QAYTA YARATILMAYDI (QC'dan farqli — bu yerda sekvens/persist
 *   kerak emas, chunki `manager-approve` vaqtida `razryad_history.certificate_number`
 *   allaqachon yozilgan); PDF faqat MAVJUD yozuvni hujjatlashtiradi (Q-40, fabrikatsiya
 *   taqiq). `change_type='manual'` yozuvlarida (2-imzo oqimidan tashqari to'g'ridan
 *   tahrirlash, `card.repository.ts`) sertifikat raqami NULL bo'lishi mumkin — bu holda
 *   ko'rsatish uchun tarix-id'ga asoslangan zaxira yorliq ishlatiladi (DB'ga yozilmaydi).
 *
 *   pdf-lib StandardFonts (WinAnsi) kirillni qo'llab-quvvatlamaydi — xodim/karta/sabab
 *   maydonlari DB'dan kirill bilan kelishi mumkin bo'lgani uchun barcha matn
 *   `toPdfSafeText()` orqali chiziladi (qc-certificate-pdf.service.ts bilan AYNAN bir
 *   xil pattern — aks holda kirill ism `WinAnsi cannot encode` bilan qulaydi, Q-40/Q-46).
 *   QR: haqiqiy skanerlanadigan QR rasm (qrcode + pdf.embedPng) — QC'dagi
 *   `embedQrCode`/`drawQrCode` bilan bir xil; alohida ochiq verifikatsiya URL yo'qligi
 *   sababli QR ichiga sertifikat raqamining o'zi kodlanadi (QC bilan bir xil asos).
 *
 * @layer Service (application)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFImage } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result, AppErr, safeCall } from '@common/result';
import { toPdfSafeText } from '@common/pdf/pdf-safe-text.helper';

type Row = Record<string, unknown>;

/** Bitta razryad-tarix yozuvi bo'yicha sertifikat uchun kerakli barcha maydonlar (JOIN natijasi). */
export interface RazryadCertificateRow {
  id: number;
  cardId: number;
  cardName: string | null;
  employeeName: string | null;
  oldRazryadName: string | null;
  oldLevel: number | null;
  newRazryadName: string | null;
  newLevel: number | null;
  changeType: string;
  reason: string | null;
  certificateNumber: string | null;
  approverName: string | null;
  effectiveAt: Date | null;
}

export interface GeneratedRazryadCertificate {
  certNumber: string;
  historyId: number;
  pdf: Buffer;
}

@Injectable()
export class RazryadCertificatePdfService {
  private readonly logger = new Logger(RazryadCertificatePdfService.name);

  /**
   * Tarix yozuvi + karta/xodim/razryad/tasdiqlovchi nomlarini bitta JOIN so'rovda o'qiydi.
   * Tasdiqlovchi: bevosita rahbar imzosi (manager_approved_by) ustuvor, bo'lmasa HR imzosi
   * (hr_approved_by) — 2-imzo oqimida odatda ikkalasi ham to'ldirilgan bo'ladi.
   */
  private async fetchRow(historyId: number): Promise<RazryadCertificateRow | null> {
    const r = await db.execute(sql`
      SELECT
        h.id, h.card_id, h.change_type, h.reason, h.certificate_number, h.effective_at,
        ro.name AS old_razryad_name, ro.level AS old_level,
        rn.name AS new_razryad_name, rn.level AS new_level,
        c.name AS card_name,
        NULLIF(TRIM(COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '')), '') AS employee_name,
        NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '') AS approver_name
      FROM razryad_history h
      LEFT JOIN razryad_levels ro ON ro.id = h.old_razryad_id
      LEFT JOIN razryad_levels rn ON rn.id = h.new_razryad_id
      LEFT JOIN org_departments c ON c.id = h.card_id
      LEFT JOIN employees e ON e.id = h.employee_id
      LEFT JOIN users u ON u.id = COALESCE(h.manager_approved_by, h.hr_approved_by)
      WHERE h.id = ${historyId}
      LIMIT 1
    `);
    const rows = ((r as { rows?: Row[] }).rows) ?? [];
    const row = rows[0];
    if (!row) return null;
    return {
      id: Number(row['id']),
      cardId: Number(row['card_id']),
      cardName: row['card_name'] != null ? String(row['card_name']) : null,
      employeeName: row['employee_name'] != null ? String(row['employee_name']) : null,
      oldRazryadName: row['old_razryad_name'] != null ? String(row['old_razryad_name']) : null,
      oldLevel: row['old_level'] != null ? Number(row['old_level']) : null,
      newRazryadName: row['new_razryad_name'] != null ? String(row['new_razryad_name']) : null,
      newLevel: row['new_level'] != null ? Number(row['new_level']) : null,
      changeType: String(row['change_type'] ?? 'increase'),
      reason: row['reason'] != null ? String(row['reason']) : null,
      certificateNumber: row['certificate_number'] != null ? String(row['certificate_number']) : null,
      approverName: row['approver_name'] != null ? String(row['approver_name']) : null,
      effectiveAt: row['effective_at'] ? new Date(String(row['effective_at'])) : null,
    };
  }

  /**
   * Tarix yozuvi bo'yicha sertifikat PDF'ini yaratadi. Yozuv topilmasa NOT_FOUND.
   * Sertifikat raqami DB'dan o'qiladi (yaratilmaydi) — NULL bo'lsa faqat KO'RSATISH
   * uchun `RZ-<id>` zaxira yorlig'i ishlatiladi (bazaga yozilmaydi, Q-40).
   */
  async generateForHistory(historyId: number): Promise<Result<GeneratedRazryadCertificate>> {
    const row = await safeCall(() => this.fetchRow(historyId), 'DB_ERROR');
    if (!row.ok) return Err(row.error);
    if (!row.data) return Err(AppErr('NOT_FOUND', `Razryad tarix yozuvi #${historyId} topilmadi`));

    const certNumber = row.data.certificateNumber ?? `RZ-${row.data.id}`;

    return safeCall(async () => {
      const pdf = await this.buildPdf(row.data as RazryadCertificateRow, certNumber);
      return { certNumber, historyId, pdf };
    }, 'INTERNAL');
  }

  // ─── PDF rendering (QC certificate PDF-builder pattern bilan bir xil) ──────

  private async buildPdf(row: RazryadCertificateRow, certNumber: string): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    // Haqiqiy skanerlanadigan QR rasm — qc-certificate-pdf.service.ts#embedQrCode bilan bir xil.
    const qrImage = await this.embedQrCode(pdf, certNumber);

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

    // Header
    draw('EuroPrint — Razryad Sertifikati / Grade Certificate', { bold: true, size: 18 });
    page.drawLine({ start: { x: 50, y: y + 4 }, end: { x: 545, y: y + 4 }, thickness: 1.2, color: rgb(0.1, 0.3, 0.6) });
    y -= 12;
    draw(`Sertifikat raqami:  ${certNumber}`, { bold: true, size: 13, color: rgb(0.1, 0.3, 0.6) });
    y -= 4;

    // Meta
    draw(`Karta:        ${row.cardName ?? '-'}`);
    draw(`Xodim:        ${row.employeeName ?? '-'}`);
    draw(`Razryad:      ${this.razryadLabel(row.oldRazryadName, row.oldLevel)}  ->  ${this.razryadLabel(row.newRazryadName, row.newLevel)}  (${this.changeTypeLabel(row.changeType)})`);
    draw(`Sana:         ${row.effectiveAt ? row.effectiveAt.toISOString().slice(0, 10) : '-'}`);
    if (row.reason) draw(`Sabab:        ${this.truncate(row.reason, 80)}`);
    y -= 8;

    // Real QR image + signature area on a fixed lower band (QC bilan bir xil joylashuv)
    this.drawQrCode(page, font, qrImage, certNumber, row.id);
    this.drawSignatureArea(page, font, bold, row.approverName);

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }

  /**
   * QR-kod PNG rasmini generatsiya qilib PDF hujjatiga embed qiladi (ISO/IEC 18004).
   * `qc-certificate-pdf.service.ts#embedQrCode` bilan bir xil pattern (QRCode.toBuffer +
   * pdf.embedPng). Alohida ochiq verifikatsiya URL/endpoint yo'q (Q-40: mavjud bo'lmagan
   * URL fabrikatsiya qilinmaydi) — shuning uchun QR ichiga sertifikat raqamining o'zi kodlanadi.
   */
  private async embedQrCode(pdf: PDFDocument, certNumber: string): Promise<PDFImage> {
    const png = await QRCode.toBuffer(certNumber, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 160,
    });
    return pdf.embedPng(png);
  }

  private razryadLabel(name: string | null, level: number | null): string {
    if (!name && level == null) return '-';
    if (name && level != null) return `${name} (${level})`;
    return name ?? `#${level}`;
  }

  private changeTypeLabel(changeType: string): string {
    if (changeType === 'decrease') return 'Pasayish';
    if (changeType === 'manual') return "Qo'lda tahrirlash";
    return "O'sish";
  }

  /**
   * Haqiqiy skanerlanadigan QR rasmini sahifaga chizadi (embedQrCode natijasi) +
   * tekshiruv matni. qc-certificate-pdf.service.ts#drawQrCode bilan bir xil
   * page.drawImage pattern.
   */
  private drawQrCode(page: PDFPage, font: PDFFont, qrImage: PDFImage, certNumber: string, historyId: number): void {
    const x = 50;
    const yTop = 170;
    const size = 90;
    page.drawImage(qrImage, { x, y: yTop - size, width: size, height: size });
    page.drawText(toPdfSafeText(`Verify: ${certNumber}`), { x, y: yTop - size - 14, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(toPdfSafeText(`Tarix ID: ${historyId}`), { x, y: yTop - size - 24, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
  }

  private drawSignatureArea(page: PDFPage, font: PDFFont, bold: PDFFont, approverName?: string | null): void {
    const x = 330;
    const yLine = 110;
    page.drawLine({ start: { x, y: yLine }, end: { x: 545, y: yLine }, thickness: 0.8, color: rgb(0, 0, 0) });
    page.drawText(toPdfSafeText('Imzo / Signature'), { x, y: yLine - 14, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(
      toPdfSafeText(approverName ? `Tasdiqlovchi: ${this.truncate(approverName, 30)}` : 'Tasdiqlovchi: __________________'),
      {
        x,
        y: yLine - 30,
        size: 9,
        font: bold,
        color: rgb(0, 0, 0),
      },
    );
    page.drawText(toPdfSafeText('M.O. / Stamp'), { x, y: yLine - 48, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(toPdfSafeText(`Hisobot: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`), {
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
