/**
 * @module pos-pdf-inventory.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Result, AppError, safeCall } from '@common/result';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import { toPdfSafeText } from '@common/pdf/pdf-safe-text.helper';
import { PosPdfInventoryRepository } from '../../infrastructure/repositories/pos-pdf-inventory.repository';

@Injectable()
export class PosPdfInventoryService {
  private readonly logger = new Logger(PosPdfInventoryService.name);

  constructor(
    private readonly repo: PosPdfInventoryRepository,
    private readonly i18n: I18nService,
  ) {}

  async generateInventoryCountPdf(countId: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      this.logger.log(`POS inventar PDF generatsiya boshlanmoqda`);
      const rows = await this.repo.getInventoryCountForPdf(countId);
  
      if (!rows.ok || !rows.data.length) {
        throw new NotFoundException(await this.i18n.t('errors.inventoryCountNotFound', { args: { id: countId } }));
      }
  
      const header = rows.data[0] as Record<string, unknown>;
      const pdfDoc = await PDFDocument.create();
      const page   = pdfDoc.addPage(PageSizes.A4);
      const { width, height } = page.getSize();
      const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const margin = 40;
      let y = height - 50;
  
      // toPdfSafeText: "№" (U+2116) pdf-lib WinAnsi (StandardFonts) da yo'q — bag-fix (FAZA D).
      page.drawText(toPdfSafeText(`INVENTARIZATSIYA NATIJASI — №${header['count_number']}`), {
        x: margin, y, size: 12, font: fontBold, color: rgb(0, 0, 0),
      });
      y -= 20;
      page.drawText(`Ombor: ${header['warehouse_id']}  |  Sana: ${new Date(header['created_at'] as string).toLocaleDateString('uz-UZ')}`, {
        x: margin, y, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3),
      });
      y -= 20;
  
      const cols = ['Material', 'O\'lch.', 'Tizimda', 'Haqiqiy', 'Farq'];
      const colW = (width - margin * 2) / 5;
  
      page.drawRectangle({ x: margin, y: y - 14, width: width - margin * 2, height: 16, color: rgb(0.9, 0.9, 0.9) });
      for (let i = 0; i < cols.length; i++) {
        page.drawText(cols[i], { x: margin + i * colW + 3, y: y - 11, size: 8, font: fontBold, color: rgb(0, 0, 0) });
      }
      y -= 20;
  
      for (const row of (rows.ok ? rows.data : [])) {
        const variance = Number(row['variance_qty'] ?? 0);
        const cells = [
          this._truncate(row['xom_ashyo'] as string ?? '—', 24),
          row['unit_of_measure'] as string ?? '—',
          Number(row['system_qty']).toFixed(2),
          Number(row['actual_qty'] ?? 0).toFixed(2),
          (variance >= 0 ? '+' : '') + variance.toFixed(2),
        ];
        const varColor = variance < 0 ? rgb(0.8, 0, 0) : variance > 0 ? rgb(0, 0.6, 0) : rgb(0, 0, 0);
        for (let i = 0; i < cells.length; i++) {
          // toPdfSafeText: xom_ashyo (material nomi) kirill bilan kiritilgan bo'lishi mumkin.
          page.drawText(toPdfSafeText(cells[i]), {
            x: margin + i * colW + 3,
            y: y - 9,
            size: 8,
            font: fontRegular,
            color: i === 4 ? varColor : rgb(0, 0, 0),
          });
        }
        page.drawLine({ start: { x: margin, y: y - 13 }, end: { x: width - margin, y: y - 13 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
        y -= 16;
      }
  
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    });
  }

  private _truncate(text: string, maxLen: number): string {
    return text.length > maxLen ? text.substring(0, maxLen - 1) + '…' : text;
  }
}
