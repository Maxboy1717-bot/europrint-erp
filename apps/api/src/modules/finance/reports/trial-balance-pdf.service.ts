/**
 * @module trial-balance-pdf.service
 * @description Sinov balansi (Trial Balance) PDF generatsiyasi — pdf-lib bilan, xuddi shu
 *   draw()-qator patternini qayta ishlatadi (CashierHubPdfService / SdInvoicePdfService,
 *   Q-46: reuse, bo'shliqni to'ldirish — takroriy qurish emas).
 *
 *   F10 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): "Real financial-statement export" —
 *   GET /api/reports/trial-balance/export/pdf ilgari yo'q edi (faqat JSON qaytardi,
 *   fayl generatsiya qilmasdi). `pdf-lib` allaqachon tasdiqlangan bog'liqlik (Cashier-Hub/
 *   SD-invoice PDF'larida ishlatiladi) — yangi kutubxona qo'shilmadi.
 * @layer Application (Finance)
 */

import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb, PageSizes, PDFPage, PDFFont } from 'pdf-lib';
import { Result, AppError, safeCall } from '@common/result';
import { toPdfSafeText } from '@common/pdf/pdf-safe-text.helper';

export interface TrialBalanceAccountRow {
  accountCode: string;
  accountName: string;
  accountType: string;
  debitBalance: number;
  creditBalance: number;
}

export interface TrialBalancePdfData {
  accounts: TrialBalanceAccountRow[];
  totals: { debitBalance: number; creditBalance: number };
  asOfDate: string;
  fiscalYear: number;
}

const MARGIN = 40;

@Injectable()
export class TrialBalancePdfService {
  /** Sinov balansi PDF generatsiya — Result<Buffer> (Qoida 1: throw yo'q). */
  async generateTrialBalancePdf(data: TrialBalancePdfData): Promise<Result<Buffer, AppError>> {
    return safeCall(async () => this._buildPdf(data));
  }

  private async _buildPdf(data: TrialBalancePdfData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = height - 50;
    y = this._drawHeader(page, data, fontBold, fontRegular, width, y);
    const { activePage, y: afterTable } = this._drawAccountsTable(page, pdfDoc, data, fontRegular, fontBold, width, y);
    this._drawTotals(activePage, data, fontRegular, fontBold, afterTable);

    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      pages[i].drawText(toPdfSafeText(`EuroPrint ERP | Moliya | Sinov balansi | ${i + 1}/${pages.length}`), {
        x: MARGIN, y: 20, size: 7, font: fontRegular, color: rgb(0.5, 0.5, 0.5),
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private _drawHeader(
    page: PDFPage, data: TrialBalancePdfData, fontBold: PDFFont, fontRegular: PDFFont, width: number, startY: number,
  ): number {
    let y = startY;
    const title = toPdfSafeText('SINOV BALANSI / ПРОБНЫЙ БАЛАНС');
    const titleWidth = fontBold.widthOfTextAtSize(title, 16);
    page.drawText(title, { x: (width - titleWidth) / 2, y, size: 16, font: fontBold, color: rgb(0, 0, 0) });
    y -= 22;

    const meta = toPdfSafeText(`Moliyaviy yil: ${data.fiscalYear}   |   Holat sanasi: ${this._fmtDate(data.asOfDate)}`);
    const metaWidth = fontRegular.widthOfTextAtSize(meta, 10);
    page.drawText(meta, { x: (width - metaWidth) / 2, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    y -= 26;
    return y;
  }

  private _drawAccountsTable(
    page: PDFPage, pdfDoc: PDFDocument, data: TrialBalancePdfData,
    fontRegular: PDFFont, fontBold: PDFFont, width: number, startY: number,
  ): { activePage: PDFPage; y: number } {
    let y = startY;
    const cols = [
      { label: 'Kod', w: 0.12 },
      { label: 'Hisob nomi', w: 0.43 },
      { label: 'Turi', w: 0.15 },
      { label: 'Debet', w: 0.15 },
      { label: 'Kredit', w: 0.15 },
    ];
    const tableWidth = width - MARGIN * 2;

    const drawHeaderRow = (p: PDFPage, atY: number) => {
      p.drawRectangle({ x: MARGIN, y: atY - 12, width: tableWidth, height: 16, color: rgb(0.9, 0.9, 0.9) });
      let x = MARGIN;
      for (const col of cols) {
        p.drawText(col.label, { x: x + 3, y: atY - 9, size: 8, font: fontBold, color: rgb(0, 0, 0) });
        x += tableWidth * col.w;
      }
    };

    drawHeaderRow(page, y);
    y -= 20;

    let activePage = page;
    const rows = Array.isArray(data.accounts) ? data.accounts : [];
    for (const acc of rows) {
      if (y < 100) {
        activePage = pdfDoc.addPage(PageSizes.A4);
        y = activePage.getSize().height - 50;
        drawHeaderRow(activePage, y);
        y -= 20;
      }
      const cells = [
        acc.accountCode,
        this._truncate(acc.accountName, 40),
        acc.accountType,
        this._fmtMoney(acc.debitBalance),
        this._fmtMoney(acc.creditBalance),
      ];
      let x = MARGIN;
      for (let i = 0; i < cells.length; i++) {
        activePage.drawText(toPdfSafeText(cells[i]), { x: x + 3, y, size: 8, font: fontRegular, color: rgb(0, 0, 0) });
        x += tableWidth * cols[i].w;
      }
      activePage.drawLine({
        start: { x: MARGIN, y: y - 4 }, end: { x: MARGIN + tableWidth, y: y - 4 },
        thickness: 0.3, color: rgb(0.85, 0.85, 0.85),
      });
      y -= 16;
    }
    if (rows.length === 0) {
      activePage.drawText(toPdfSafeText('— faol hisoblar topilmadi —'), { x: MARGIN, y, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
      y -= 16;
    }
    return { activePage, y };
  }

  private _drawTotals(page: PDFPage, data: TrialBalancePdfData, fontRegular: PDFFont, fontBold: PDFFont, startY: number): void {
    let y = startY - 8;
    page.drawLine({ start: { x: MARGIN, y: y + 6 }, end: { x: page.getWidth() - MARGIN, y: y + 6 }, thickness: 0.8, color: rgb(0, 0, 0) });
    const totalDebit = Number(data.totals?.debitBalance ?? 0);
    const totalCredit = Number(data.totals?.creditBalance ?? 0);
    const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

    page.drawText(toPdfSafeText(`JAMI DEBET / ИТОГО ДЕБЕТ: ${this._fmtMoney(totalDebit)}`), { x: MARGIN, y, size: 10, font: fontBold, color: rgb(0, 0, 0) });
    y -= 16;
    page.drawText(toPdfSafeText(`JAMI KREDIT / ИТОГО КРЕДИТ: ${this._fmtMoney(totalCredit)}`), { x: MARGIN, y, size: 10, font: fontBold, color: rgb(0, 0, 0) });
    y -= 20;
    page.drawText(
      toPdfSafeText(balanced ? "BALANSLANGAN (Debet = Kredit)" : "BALANSSIZ — Debet != Kredit!"),
      { x: MARGIN, y, size: 11, font: fontBold, color: balanced ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0) },
    );
  }

  private _fmtMoney(amount: number): string {
    return Number(amount || 0).toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private _fmtDate(d: string | null): string {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private _truncate(text: string, maxLen: number): string {
    return text.length > maxLen ? text.substring(0, maxLen - 1) + '…' : text;
  }
}
