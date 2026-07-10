/**
 * @module mm-reconciliation-pdf.service
 * @description Sverka akti (vendor reconciliation act) PDF generation — pdf-lib, same
 *   draw() pattern as TrialBalancePdfService / CashierHubPdfService (Q-46 reuse — no new
 *   library). Returns Result<Buffer> (Qoida 1: never throws).
 * @layer Application (MM)
 */

import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb, PageSizes, PDFPage, PDFFont } from 'pdf-lib';
import { Result, AppError, safeCall } from '@common/result';
import { toPdfSafeText } from '@common/pdf/pdf-safe-text.helper';

export interface ReconciliationPdfData {
  vendorName: string;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  goodsReceived: number;
  invoiced: number;
  payments: number;
  closingBalance: number;
  discrepancy: number;
  hasDiscrepancy: boolean;
  generatedAt: string;
}

const MARGIN = 40;

@Injectable()
export class MmReconciliationPdfService {
  async generate(data: ReconciliationPdfData): Promise<Result<Buffer, AppError>> {
    return safeCall(async () => this._buildPdf(data));
  }

  private async _buildPdf(data: ReconciliationPdfData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = height - 50;
    y = this._drawHeader(page, data, fontBold, fontRegular, width, y);
    y = this._drawLines(page, data, fontRegular, fontBold, width, y);
    this._drawDiscrepancyBanner(page, data, fontBold, y);

    page.drawText(
      toPdfSafeText(`EuroPrint ERP | Ta'minot | Sverka akti | ${this._fmtDateTime(data.generatedAt)}`),
      { x: MARGIN, y: 20, size: 7, font: fontRegular, color: rgb(0.5, 0.5, 0.5) },
    );

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private _drawHeader(
    page: PDFPage, data: ReconciliationPdfData, fontBold: PDFFont, fontRegular: PDFFont, width: number, startY: number,
  ): number {
    let y = startY;
    const title = toPdfSafeText('SVERKA AKTI / АКТ СВЕРКИ');
    const tw = fontBold.widthOfTextAtSize(title, 16);
    page.drawText(title, { x: (width - tw) / 2, y, size: 16, font: fontBold, color: rgb(0, 0, 0) });
    y -= 24;
    page.drawText(toPdfSafeText(`Yetkazib beruvchi: ${data.vendorName}`), {
      x: MARGIN, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1),
    });
    y -= 16;
    page.drawText(toPdfSafeText(`Davr: ${this._fmtDate(data.fromDate)} - ${this._fmtDate(data.toDate)}`), {
      x: MARGIN, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3),
    });
    y -= 26;
    return y;
  }

  private _drawLines(
    page: PDFPage, data: ReconciliationPdfData, fontRegular: PDFFont, fontBold: PDFFont, width: number, startY: number,
  ): number {
    const rows: Array<{ label: string; value: number; bold?: boolean }> = [
      { label: 'Boshlang\'ich saldo (opening)', value: data.openingBalance },
      { label: 'Qabul qilingan tovar (kirim)', value: data.goodsReceived },
      { label: 'Schyot-faktura (invoiced)', value: data.invoiced },
      { label: 'To\'lovlar (payments)', value: data.payments },
      { label: 'Yakuniy qoldiq = boshlang\'ich + faktura - to\'lov', value: data.closingBalance, bold: true },
    ];
    const tableWidth = width - MARGIN * 2;
    let y = startY;
    page.drawRectangle({ x: MARGIN, y: y - 12, width: tableWidth, height: 16, color: rgb(0.9, 0.9, 0.9) });
    page.drawText(toPdfSafeText('Ko\'rsatkich'), { x: MARGIN + 3, y: y - 9, size: 8, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText(toPdfSafeText('Summa (UZS)'), { x: MARGIN + tableWidth - 150, y: y - 9, size: 8, font: fontBold, color: rgb(0, 0, 0) });
    y -= 22;
    for (const r of rows) {
      const font = r.bold ? fontBold : fontRegular;
      page.drawText(toPdfSafeText(r.label), { x: MARGIN + 3, y, size: 9, font, color: rgb(0, 0, 0) });
      const val = toPdfSafeText(this._fmtMoney(r.value));
      const vw = font.widthOfTextAtSize(val, 9);
      page.drawText(val, { x: MARGIN + tableWidth - 5 - vw, y, size: 9, font, color: rgb(0, 0, 0) });
      page.drawLine({
        start: { x: MARGIN, y: y - 4 }, end: { x: MARGIN + tableWidth, y: y - 4 },
        thickness: 0.3, color: rgb(0.85, 0.85, 0.85),
      });
      y -= 18;
    }
    return y - 6;
  }

  private _drawDiscrepancyBanner(
    page: PDFPage, data: ReconciliationPdfData, fontBold: PDFFont, startY: number,
  ): void {
    let y = startY - 8;
    const col = data.hasDiscrepancy ? rgb(0.8, 0, 0) : rgb(0, 0.5, 0);
    page.drawText(
      toPdfSafeText(`Nomuvofiqlik (faktura - qabul): ${this._fmtMoney(data.discrepancy)} UZS`),
      { x: MARGIN, y, size: 10, font: fontBold, color: col },
    );
    y -= 18;
    page.drawText(
      toPdfSafeText(data.hasDiscrepancy ? 'DIQQAT: summalar mos kelmaydi (discrepancy)' : 'Mos keladi - nomuvofiqlik yo\'q'),
      { x: MARGIN, y, size: 11, font: fontBold, color: col },
    );
  }

  private _fmtMoney(amount: number): string {
    return Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private _fmtDate(d: string | null): string {
    if (!d) return '-';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private _fmtDateTime(d: string | null): string {
    if (!d) return '-';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }
}
