/**
 * @module sd-quotation-pdf.service
 * @description Kotirovka (KP / commercial proposal) PDF generatsiyasi — pdf-lib bilan,
 *   xuddi SdInvoicePdfService draw()-qator patternini qayta ishlatadi (Q-46: reuse,
 *   bo'shliqni to'ldirish — takroriy qurish emas). Mijozga yuboriladigan KP: letterhead
 *   (logo o'rni) + qatorlar/narx + jami/soliq + to'lov sharti + imzo bloki.
 *   Margin/cost_price ATAYIN chiqarilmaydi (mijozga ko'rsatilmaydi — #43 rol-masking
 *   masalasidan xoli). Komdir imzosi (ism+tel) = alohida item #109, bu yerda deferred.
 *   Vision: TASDIQ-2146 §06 #58 (KP avto-PDF: logo+narx+to'lov+imzo).
 * @layer Application (SD)
 */

import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb, PageSizes, PDFPage, PDFFont } from 'pdf-lib';
import { Result, AppError, safeCall } from '@common/result';
import { toPdfSafeText } from '@common/pdf/pdf-safe-text.helper';

export interface QuotationPdfLine {
  name:      string;
  paperType: string;
  quantity:  number;
  unitPrice: number;
  colors:    number;
  lineTotal: number;
}

export interface QuotationPdfData {
  quotationNumber: string;
  customerName:    string;
  status:          string;
  quotationDate:   string | null;
  validUntil:      string | null;
  subtotal:        number;
  taxAmount:       number;
  totalAmount:     number;
  currency:        string;
  notes:           string | null;
  lines:           QuotationPdfLine[];
}

const STATUS_LABEL: Record<string, string> = {
  draft:     'Qoralama',
  sent:      'Yuborilgan',
  approved:  'Tasdiqlangan',
  converted: 'Buyurtmaga aylantirilgan',
  rejected:  'Rad etilgan',
  expired:   "Muddati o'tgan",
};

const MARGIN = 40;

@Injectable()
export class SdQuotationPdfService {
  /** Kotirovka (KP) PDF generatsiya — Result<Buffer> (Qoida 1: throw yo'q). */
  async generateQuotationPdf(data: QuotationPdfData): Promise<Result<Buffer, AppError>> {
    return safeCall(async () => this._buildPdf(data));
  }

  private async _buildPdf(data: QuotationPdfData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = height - 50;
    y = this._drawHeader(page, data, fontBold, fontRegular, width, y);
    y = this._drawMeta(page, data, fontRegular, fontBold, y);
    const { activePage, y: afterTable } = this._drawItemsTable(page, pdfDoc, data, fontRegular, fontBold, width, y);
    this._drawTotalsAndSignatures(activePage, data, fontRegular, fontBold, afterTable);

    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1] ?? page;
    lastPage.drawText(`EuroPrint ERP | SD | KP | ${new Date().toLocaleDateString('uz-UZ')}`, {
      x: MARGIN, y: 20, size: 7, font: fontRegular, color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private _drawHeader(
    page: PDFPage, data: QuotationPdfData, fontBold: PDFFont, fontRegular: PDFFont, width: number, startY: number,
  ): number {
    let y = startY;
    // Letterhead / logo o'rni (matnli — binar logo aktivi yo'q, fabrikatsiya qilinmaydi).
    page.drawText('EUROPRINT', { x: MARGIN, y, size: 18, font: fontBold, color: rgb(0.11, 0.30, 0.55) });
    page.drawText(toPdfSafeText('Karton va bosma mahsulotlar'), { x: MARGIN, y: y - 12, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    y -= 34;

    const title = toPdfSafeText('KOMMERSIYA TAKLIFI (KP) / КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ');
    const titleWidth = fontBold.widthOfTextAtSize(title, 13);
    page.drawText(title, { x: (width - titleWidth) / 2, y, size: 13, font: fontBold, color: rgb(0, 0, 0) });
    y -= 20;
    const numLine = toPdfSafeText(`№ ${data.quotationNumber}`);
    const numWidth = fontBold.widthOfTextAtSize(numLine, 12);
    page.drawText(numLine, { x: (width - numWidth) / 2, y, size: 12, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    y -= 24;
    return y;
  }

  private _drawMeta(page: PDFPage, data: QuotationPdfData, fontRegular: PDFFont, fontBold: PDFFont, startY: number): number {
    let y = startY;
    // customerName — dinamik DB-qiymat, kirill bo'lishi mumkin.
    page.drawText(toPdfSafeText(`Mijoz / Клиент: ${data.customerName || '—'}`), { x: MARGIN, y, size: 10, font: fontBold, color: rgb(0, 0, 0) });
    y -= 16;
    const meta: Array<[string, string]> = [
      ['Sana / Дата:',                        this._fmtDate(data.quotationDate)],
      ['Amal qilish muddati / Действует до:',  this._fmtDate(data.validUntil)],
      ['Holat / Статус:',                      STATUS_LABEL[data.status] ?? data.status],
    ];
    for (const [label, value] of meta) {
      page.drawText(toPdfSafeText(`${label}  ${value}`), { x: MARGIN, y, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
      y -= 14;
    }
    y -= 8;
    return y;
  }

  private _drawItemsTable(
    page: PDFPage, pdfDoc: PDFDocument, data: QuotationPdfData,
    fontRegular: PDFFont, fontBold: PDFFont, width: number, startY: number,
  ): { activePage: PDFPage; y: number } {
    let y = startY;
    const cols = ['Nomi', "Qog'oz", 'Ranglar', 'Miqdor', 'Narx', 'Jami'];
    const colWidth = (width - MARGIN * 2) / cols.length;

    page.drawRectangle({ x: MARGIN, y: y - 12, width: width - MARGIN * 2, height: 16, color: rgb(0.9, 0.9, 0.9) });
    for (let i = 0; i < cols.length; i++) {
      page.drawText(toPdfSafeText(cols[i]), { x: MARGIN + i * colWidth + 3, y: y - 9, size: 8, font: fontBold, color: rgb(0, 0, 0) });
    }
    y -= 20;

    let activePage = page;
    for (const line of data.lines) {
      if (y < 110) {
        activePage = pdfDoc.addPage(PageSizes.A4);
        y = activePage.getSize().height - 50;
      }
      const cells = [
        this._truncate(line.name, 22),
        this._truncate(line.paperType, 12),
        String(line.colors),
        this._fmtNum(line.quantity),
        this._fmtMoney(line.unitPrice),
        this._fmtMoney(line.lineTotal),
      ];
      for (let i = 0; i < cells.length; i++) {
        // toPdfSafeText: qator nomi (product_type) kirill bilan kiritilgan bo'lishi mumkin.
        activePage.drawText(toPdfSafeText(cells[i]), { x: MARGIN + i * colWidth + 3, y, size: 8, font: fontRegular, color: rgb(0, 0, 0) });
      }
      activePage.drawLine({ start: { x: MARGIN, y: y - 4 }, end: { x: width - MARGIN, y: y - 4 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
      y -= 16;
    }
    if (data.lines.length === 0) {
      activePage.drawText(toPdfSafeText("— kotirovka qatorlari yo'q —"), { x: MARGIN, y, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
      y -= 16;
    }
    return { activePage, y };
  }

  private _drawTotalsAndSignatures(
    page: PDFPage, data: QuotationPdfData, fontRegular: PDFFont, fontBold: PDFFont, startY: number,
  ): void {
    const cur = data.currency || 'UZS';
    let y = startY - 8;
    page.drawText(toPdfSafeText(`Oraliq summa / Подытог: ${this._fmtMoney(data.subtotal)} ${cur}`), { x: MARGIN, y, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
    y -= 14;
    page.drawText(toPdfSafeText(`Soliq (QQS) / Налог (НДС): ${this._fmtMoney(data.taxAmount)} ${cur}`), { x: MARGIN, y, size: 9, font: fontRegular, color: rgb(0, 0, 0) });
    y -= 14;
    page.drawText(toPdfSafeText(`JAMI / ИТОГО: ${this._fmtMoney(data.totalAmount)} ${cur}`), { x: MARGIN, y, size: 11, font: fontBold, color: rgb(0, 0, 0) });
    y -= 26;

    if (data.notes) {
      // notes — dinamik matn, kirill bo'lishi mumkin.
      page.drawText(toPdfSafeText(`To'lov sharti / Условия оплаты: ${this._truncate(data.notes, 90)}`), { x: MARGIN, y, size: 8, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      y -= 26;
    }

    const sigLabels = ['Taklif etuvchi / Предлагает:', 'Qabul qildi / Принял:'];
    for (const label of sigLabels) {
      page.drawText(toPdfSafeText(label), { x: MARGIN, y, size: 8, font: fontRegular, color: rgb(0, 0, 0) });
      page.drawLine({ start: { x: MARGIN + 160, y }, end: { x: MARGIN + 330, y }, thickness: 0.5, color: rgb(0.3, 0.3, 0.3) });
      y -= 26;
    }
  }

  private _fmtMoney(amount: number): string {
    return Number(amount || 0).toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private _fmtNum(n: number): string {
    return Number(n || 0).toLocaleString('uz-UZ');
  }

  private _fmtDate(d: string | null): string {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private _truncate(text: string, maxLen: number): string {
    return text.length > maxLen ? text.substring(0, maxLen - 1) + '…' : text;
  }
}
