/**
 * @module sd-invoice-pdf.service
 * @description Hisob-faktura (invoice) PDF generatsiyasi — pdf-lib bilan, xuddi shu
 *   draw()-qator patternini qayta ishlatadi (CashierHubPdfService / PosPdfService,
 *   Q-46: reuse, bo'shliqni to'ldirish — takroriy qurish emas).
 *   APPROVED: egasi vizyon-qurish 2026-07-01, FAZA D (Hujjat/PDF akt).
 * @layer Application (SD)
 */

import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb, PageSizes, PDFPage, PDFFont } from 'pdf-lib';
import { Result, AppError, safeCall } from '@common/result';
import { toPdfSafeText } from '@common/pdf/pdf-safe-text.helper';

export interface InvoicePdfLine {
  name:      string;
  quantity:  number;
  unitPrice: number;
  taxRate:   number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  customerName:  string;
  status:        string;
  createdAt:     Date | string | null;
  dueDate:       Date | string | null;
  subtotal:      number;
  taxAmount:     number;
  totalAmount:   number;
  paidAmount:    number;
  notes:         string | null;
  lines:         InvoicePdfLine[];
}

/**
 * 3-tur: eksport-invoys (Incoterms). Master-reja 3.5 + EP-SD-070 (JAVOBLANGAN —
 * "variant tanlanadi: samovyvoz / zavod yetkazadi"). `deliveryTerm`/`incotermCode`/
 * `currency` — ixtiyoriy (EGASI-DATA fabrikatsiya qilinmagan, Q-40 fail-safe):
 * bo'sh bo'lsa PDF blok "—" ko'rsatadi, generatsiya rad etilmaydi.
 */
export interface ExportInvoicePdfData extends InvoicePdfData {
  deliveryTerm: string | null;
  incotermCode: string | null;
  currency:     string | null;
}

const STATUS_LABEL: Record<string, string> = {
  draft:     'Qoralama',
  sent:      'Yuborilgan',
  paid:      "To'langan",
  partial:   "Qisman to'langan",
  overdue:   "Muddati o'tgan",
  cancelled: 'Bekor qilingan',
};

const MARGIN = 40;

@Injectable()
export class SdInvoicePdfService {
  /** Hisob-faktura PDF generatsiya — Result<Buffer> (Qoida 1: throw yo'q). */
  async generateInvoicePdf(data: InvoicePdfData): Promise<Result<Buffer, AppError>> {
    return safeCall(async () => this._buildPdf(data));
  }

  /**
   * 3-tur: eksport-invoys (Incoterms) — Master-reja 3.5. Xuddi shu draw()-pattern,
   * qo'shimcha "Yetkazib berish sharti" bloki bilan (EP-SD-070 javobiga mos).
   */
  async generateExportInvoicePdf(data: ExportInvoicePdfData): Promise<Result<Buffer, AppError>> {
    return safeCall(async () => this._buildPdf(data, { exportMode: true }));
  }

  private async _buildPdf(data: InvoicePdfData, opts?: { exportMode: boolean }): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = height - 50;
    y = this._drawHeader(page, data, fontBold, width, y, opts?.exportMode ?? false);
    y = this._drawMeta(page, data, fontRegular, fontBold, y);
    if (opts?.exportMode) {
      y = this._drawExportTerms(page, data as ExportInvoicePdfData, fontRegular, fontBold, y);
    }
    const { activePage, y: afterTable } = this._drawItemsTable(page, pdfDoc, data, fontRegular, fontBold, width, y);
    const currencyLabel = opts?.exportMode ? ((data as ExportInvoicePdfData).currency ?? 'UZS') : 'UZS';
    this._drawTotalsAndSignatures(activePage, data, fontRegular, fontBold, afterTable, currencyLabel);

    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1] ?? page;
    lastPage.drawText(`EuroPrint ERP | SD | ${new Date().toLocaleDateString('uz-UZ')}`, {
      x: MARGIN, y: 20, size: 7, font: fontRegular, color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Eksport-invoys "Yetkazib berish sharti" bloki (EP-SD-070). Maydonlar ixtiyoriy —
   * DB'da yo'q bo'lsa "—" ko'rsatiladi, hech qanday qiymat fabrikatsiya qilinmaydi.
   */
  private _drawExportTerms(
    page: PDFPage, data: ExportInvoicePdfData, fontRegular: PDFFont, fontBold: PDFFont, startY: number,
  ): number {
    let y = startY;
    page.drawText(toPdfSafeText("Yetkazib berish sharti / Условия поставки:"), {
      x: MARGIN, y, size: 9, font: fontBold, color: rgb(0, 0, 0),
    });
    y -= 14;
    const rows: Array<[string, string]> = [
      ['Shart (Incoterms):', data.deliveryTerm ?? '—'],
      ['Incoterms kod:',     data.incotermCode ?? '—'],
      ['Valyuta / Валюта:',  data.currency ?? 'UZS'],
    ];
    for (const [label, value] of rows) {
      page.drawText(toPdfSafeText(`${label}  ${value}`), { x: MARGIN, y, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
      y -= 14;
    }
    y -= 6;
    return y;
  }

  private _drawHeader(
    page: PDFPage, data: InvoicePdfData, fontBold: PDFFont, width: number, startY: number,
    exportMode = false,
  ): number {
    let y = startY;
    // toPdfSafeText: pdf-lib StandardFonts (WinAnsi) kirill harflarni qo'llab-
    // quvvatlamaydi — lotin transliteratsiyasiga o'giriladi (Q-40 bag-fix, FAZA D).
    const title = toPdfSafeText(
      exportMode ? 'EKSPORT INVOYS / EXPORT INVOICE' : 'HISOB-FAKTURA / СЧЁТ-ФАКТУРА',
    );
    const titleWidth = fontBold.widthOfTextAtSize(title, 16);
    page.drawText(title, { x: (width - titleWidth) / 2, y, size: 16, font: fontBold, color: rgb(0, 0, 0) });
    y -= 22;

    const numLine = toPdfSafeText(`№ ${data.invoiceNumber}`);
    const numWidth = fontBold.widthOfTextAtSize(numLine, 12);
    page.drawText(numLine, { x: (width - numWidth) / 2, y, size: 12, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    y -= 26;
    return y;
  }

  private _drawMeta(page: PDFPage, data: InvoicePdfData, fontRegular: PDFFont, fontBold: PDFFont, startY: number): number {
    let y = startY;
    // toPdfSafeText: customerName — dinamik DB-qiymat, kirill bilan kiritilgan
    // bo'lishi mumkin (mijoz nomi).
    page.drawText(toPdfSafeText(`Mijoz / Клиент: ${data.customerName || '—'}`), { x: MARGIN, y, size: 10, font: fontBold, color: rgb(0, 0, 0) });
    y -= 16;
    const meta = [
      [`Sana / Дата:`,              this._fmtDate(data.createdAt)],
      [`To'lov muddati / Срок:`,    this._fmtDate(data.dueDate)],
      [`Holat / Статус:`,           STATUS_LABEL[data.status] ?? data.status],
    ];
    for (const [label, value] of meta) {
      page.drawText(toPdfSafeText(`${label}  ${value}`), { x: MARGIN, y, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
      y -= 14;
    }
    y -= 8;
    return y;
  }

  private _drawItemsTable(
    page: PDFPage, pdfDoc: PDFDocument, data: InvoicePdfData,
    fontRegular: PDFFont, fontBold: PDFFont, width: number, startY: number,
  ): { activePage: PDFPage; y: number } {
    let y = startY;
    const cols = ['Nomi', 'Miqdor', 'Narx', "Soliq %", 'Jami'];
    const colWidth = (width - MARGIN * 2) / cols.length;

    page.drawRectangle({ x: MARGIN, y: y - 12, width: width - MARGIN * 2, height: 16, color: rgb(0.9, 0.9, 0.9) });
    for (let i = 0; i < cols.length; i++) {
      page.drawText(cols[i], { x: MARGIN + i * colWidth + 3, y: y - 9, size: 8, font: fontBold, color: rgb(0, 0, 0) });
    }
    y -= 20;

    let activePage = page;
    for (const line of data.lines) {
      if (y < 100) {
        activePage = pdfDoc.addPage(PageSizes.A4);
        y = activePage.getSize().height - 50;
      }
      const itemTotal = line.quantity * line.unitPrice * (1 + line.taxRate / 100);
      const cells = [
        this._truncate(line.name, 28),
        line.quantity.toFixed(2),
        this._fmtMoney(line.unitPrice),
        `${line.taxRate}%`,
        this._fmtMoney(itemTotal),
      ];
      for (let i = 0; i < cells.length; i++) {
        // toPdfSafeText: qator nomi (line.name) kirill bilan kiritilgan bo'lishi mumkin.
        activePage.drawText(toPdfSafeText(cells[i]), { x: MARGIN + i * colWidth + 3, y, size: 8, font: fontRegular, color: rgb(0, 0, 0) });
      }
      activePage.drawLine({
        start: { x: MARGIN, y: y - 4 }, end: { x: width - MARGIN, y: y - 4 },
        thickness: 0.3, color: rgb(0.8, 0.8, 0.8),
      });
      y -= 16;
    }
    if (data.lines.length === 0) {
      activePage.drawText('— hisob-faktura qatorlari yo\'q —', { x: MARGIN, y, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
      y -= 16;
    }
    return { activePage, y };
  }

  private _drawTotalsAndSignatures(
    page: PDFPage, data: InvoicePdfData, fontRegular: PDFFont, fontBold: PDFFont, startY: number,
    currencyLabel = 'UZS',
  ): void {
    let y = startY - 8;
    page.drawText(toPdfSafeText(`Oraliq summa / Подытог: ${this._fmtMoney(data.subtotal)} ${currencyLabel}`), { x: MARGIN, y, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
    y -= 14;
    page.drawText(toPdfSafeText(`Soliq / Налог: ${this._fmtMoney(data.taxAmount)} ${currencyLabel}`), { x: MARGIN, y, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
    y -= 14;
    page.drawText(toPdfSafeText(`JAMI / ИТОГО: ${this._fmtMoney(data.totalAmount)} ${currencyLabel}`), { x: MARGIN, y, size: 11, font: fontBold, color: rgb(0, 0, 0) });
    y -= 14;
    const paidColor = data.paidAmount >= data.totalAmount ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0);
    page.drawText(toPdfSafeText(`To'langan / Оплачено: ${this._fmtMoney(data.paidAmount)} ${currencyLabel}`), { x: MARGIN, y, size: 9, font: fontRegular, color: paidColor });
    y -= 26;

    if (data.notes) {
      // toPdfSafeText: izoh (notes) — dinamik matn, kirill bo'lishi mumkin.
      page.drawText(toPdfSafeText(`Izoh / Примечание: ${this._truncate(data.notes, 90)}`), { x: MARGIN, y, size: 8, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      y -= 26;
    }

    const sigLabels = ['Yetkazib berdi / Отгрузил:', 'Qabul qildi / Принял:'];
    for (const label of sigLabels) {
      page.drawText(toPdfSafeText(label), { x: MARGIN, y, size: 8, font: fontRegular, color: rgb(0, 0, 0) });
      page.drawLine({ start: { x: MARGIN + 150, y }, end: { x: MARGIN + 320, y }, thickness: 0.5, color: rgb(0.3, 0.3, 0.3) });
      y -= 26;
    }
  }

  private _fmtMoney(amount: number): string {
    return Number(amount || 0).toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private _fmtDate(d: Date | string | null): string {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private _truncate(text: string, maxLen: number): string {
    return text.length > maxLen ? text.substring(0, maxLen - 1) + '…' : text;
  }
}
