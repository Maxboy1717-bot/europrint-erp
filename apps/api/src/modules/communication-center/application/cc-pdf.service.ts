/**
 * Communication Center — Hujjat PDF generatori
 *
 * Kompaniya blanki + QR kod + imzolar zanjiri bilan rasmiy hujjat PDF.
 * QR kod hujjatning haqiqiyligini autentifikatsiyasiz tekshirish uchun.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

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

  /**
   * Hujjatdan A4 PDF yaratadi: kompaniya blanki + matn + imzolar + QR kod URL.
   * QR kod o'zi rasm sifatida embed qilinmaydi (qrcode kutubxonasi yo'q),
   * lekin URL matn shaklida ko'rsatiladi va HTML/Telegram preview QR yaratadi.
   */
  async generate(documentId: string, baseUrl: string): Promise<Uint8Array> {
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
    if (!doc) throw new NotFoundException('Hujjat topilmadi');

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

    // ── PDF yaratamiz ─────────────────────────────────────────────────
    const pdf  = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const M = 50;     // margin
    let y = 800;

    // Header — kompaniya nomi
    page.drawText('EUROPRINT', { x: M, y, size: 22, font: bold, color: rgb(0.05, 0.30, 0.85) });
    page.drawText('Karton va qadoqlash mahsulotlari', { x: M, y: y - 18, size: 9, font, color: rgb(0.40, 0.45, 0.55) });
    page.drawText("Qo'qon shahri, O'zbekiston", { x: M, y: y - 30, size: 9, font, color: rgb(0.40, 0.45, 0.55) });

    // Sana + raqam (o'ng tarafda)
    const dateStr = new Date(doc.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
    page.drawText(`№ ${doc.document_number}`, { x: 400, y, size: 11, font: bold, color: rgb(0.10, 0.15, 0.25) });
    page.drawText(`Sana: ${dateStr}`,         { x: 400, y: y - 15, size: 9, font, color: rgb(0.40, 0.45, 0.55) });

    // Bo'luvchi chiziq
    y -= 50;
    page.drawLine({ start: { x: M, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.85, 0.88, 0.92) });

    // Hujjat turi
    y -= 25;
    page.drawText(this.transliterate(doc.template_name_uz.toUpperCase()), {
      x: M, y, size: 13, font: bold, color: rgb(0.10, 0.15, 0.25),
    });

    // Mavzu
    y -= 25;
    page.drawText('Mavzu:', { x: M, y, size: 9, font: bold, color: rgb(0.40, 0.45, 0.55) });
    page.drawText(this.transliterate(doc.subject), {
      x: M + 50, y, size: 11, font, color: rgb(0.10, 0.15, 0.25),
    });

    // Yuboruvchi
    y -= 18;
    page.drawText('Yuboruvchi:', { x: M, y, size: 9, font: bold, color: rgb(0.40, 0.45, 0.55) });
    page.drawText(this.transliterate(doc.sender_name ?? "Noma'lum"), {
      x: M + 70, y, size: 10, font, color: rgb(0.10, 0.15, 0.25),
    });

    // Asosiy matn
    y -= 35;
    const lines = this.wrapText(this.transliterate(doc.ai_body), 95);
    for (const line of lines) {
      if (y < 200) break;
      page.drawText(line, { x: M, y, size: 10, font, color: rgb(0.15, 0.20, 0.30) });
      y -= 14;
    }

    if (doc.sender_comment) {
      y -= 10;
      page.drawText('Izoh:', { x: M, y, size: 9, font: bold, color: rgb(0.40, 0.45, 0.55) });
      y -= 14;
      const cmtLines = this.wrapText(this.transliterate(doc.sender_comment), 95);
      for (const line of cmtLines) {
        if (y < 200) break;
        page.drawText(line, { x: M, y, size: 9, font, color: rgb(0.30, 0.35, 0.45) });
        y -= 12;
      }
    }

    // Imzolar zanjiri
    y = Math.min(y - 30, 250);
    page.drawLine({ start: { x: M, y: y + 8 }, end: { x: 545, y: y + 8 }, thickness: 0.5, color: rgb(0.85, 0.88, 0.92) });
    page.drawText('IMZOLAR ZANJIRI', { x: M, y, size: 9, font: bold, color: rgb(0.40, 0.45, 0.55) });
    y -= 18;

    for (const ap of apprRes.rows) {
      if (y < 100) break;
      const stateLabel = ap.state === 'approved' ? '✓ Tasdiqlandi'
                       : ap.state === 'rejected' ? '✗ Rad etildi'
                       : '○ Kutilmoqda';
      const signedAt = ap.signed_at ? new Date(ap.signed_at).toLocaleString('uz-UZ') : '—';
      page.drawText(`${ap.step_order}. ${this.transliterate(ap.approver_name ?? 'Noma\'lum')}`, {
        x: M, y, size: 10, font, color: rgb(0.10, 0.15, 0.25),
      });
      page.drawText(stateLabel, { x: 280, y, size: 9, font, color: ap.state === 'approved' ? rgb(0.10, 0.60, 0.40) : ap.state === 'rejected' ? rgb(0.85, 0.20, 0.20) : rgb(0.50, 0.55, 0.65) });
      page.drawText(signedAt,    { x: 410, y, size: 9, font, color: rgb(0.40, 0.45, 0.55) });
      y -= 16;
    }

    // QR Code URL (matnda)
    y = 80;
    const qrUrl = `${baseUrl}/cc/verify/${doc.id}`;
    page.drawLine({ start: { x: M, y: y + 18 }, end: { x: 545, y: y + 18 }, thickness: 0.5, color: rgb(0.85, 0.88, 0.92) });
    page.drawText('Hujjat haqiqiyligini tekshirish:', { x: M, y, size: 8, font: bold, color: rgb(0.40, 0.45, 0.55) });
    page.drawText(qrUrl, { x: M, y: y - 12, size: 7, font, color: rgb(0.20, 0.40, 0.85) });
    page.drawText(`Status: ${doc.workflow_state.toUpperCase()}`, { x: 400, y, size: 9, font: bold, color: rgb(0.10, 0.15, 0.25) });

    return await pdf.save();
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
