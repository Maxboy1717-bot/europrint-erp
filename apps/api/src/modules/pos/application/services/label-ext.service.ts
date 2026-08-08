/**
 * @module label-ext.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PRINTER_DEFAULT_PORT, DEFAULT_TIMEOUT_MS, MM_TO_PT_RATIO, DEFAULT_BARCODE } from '@common/constants/app.constants';
import { Result, AppError, safeCall } from '@common/result';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as net from 'net';
import type { LabelData, LabelFormat, PrinterConfig } from './label.service';
import { PosPrinterConfigRepository } from '../../infrastructure/repositories/pos-printer-config.repository';
import { generateQrMatrix, buildQrPayload } from './label-qr.util';
import { LABEL_QR_MODULE_PT } from '@common/constants/app.constants';
@Injectable()
export class LabelExtService {
  private readonly logger = new Logger(LabelExtService.name);

  constructor(
    private readonly printerConfigRepo: PosPrinterConfigRepository,
    private readonly i18n: I18nService,
  ) {}

  async generatePdf(data: LabelData): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      const pdfDoc = await PDFDocument.create();
      const mmToPt = MM_TO_PT_RATIO;
      const labelW = 58 * mmToPt;
      const labelH = 40 * mmToPt;
  
      const page        = pdfDoc.addPage([labelW, labelH]);
      const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
      const h = page.getHeight();
  
      const name = data.materialName.length > 26
        ? data.materialName.substring(0, 26) + '…'
        : data.materialName;
  
      page.drawText(name, {
        x: 4, y: h - 10,
        size: 7.5, font: fontBold, color: rgb(0, 0, 0),
      });
  
      const barcode = data.barcode || DEFAULT_BARCODE;
      const barX = 4;
      const barY = h - 48;
      const barH = 30;
  
      let xPos = barX;
      for (let i = 0; i < barcode.length; i++) {
        const digit     = parseInt(barcode[i], 10) || 1;
        const barWidth  = (digit % 3 === 0) ? 1.6 : (digit % 2 === 0) ? 1.1 : 0.9;
        const isSpace   = i % 4 === 3;
        if (!isSpace) {
          page.drawRectangle({ x: xPos, y: barY, width: barWidth, height: barH, color: rgb(0, 0, 0) });
        }
        xPos += barWidth + 0.6;
      }
  
      page.drawText(barcode, {
        x: barX, y: barY - 8,
        size: 6, font: fontRegular, color: rgb(0, 0, 0),
      });
  
      let infoY = barY - 18;
  
      if (data.batchNumber) {
        page.drawText(`Partiya: ${data.batchNumber}`, {
          x: barX, y: infoY, size: 6, font: fontRegular, color: rgb(0, 0, 0),
        });
        infoY -= 9;
      }
  
      if (data.quantity !== undefined) {
        page.drawText(`Miqdor: ${data.quantity} ${data.unitOfMeasure ?? ''}`, {
          x: barX, y: infoY, size: 6, font: fontRegular, color: rgb(0, 0, 0),
        });
        infoY -= 9;
      }
  
      if (data.expiryDate) {
        page.drawText(`Muddati: ${data.expiryDate}`, {
          x: barX, y: infoY, size: 6, font: fontBold, color: rgb(0.7, 0, 0),
        });
      }
  
      page.drawText(`EuroPrint | ${data.date}`, {
        x: barX, y: 2,
        size: 5, font: fontRegular, color: rgb(0.5, 0.5, 0.5),
      });

      // QR-kod — har material/lot uchun avtomatik (spec: EAN-13+Code-128+QR).
      // Haqiqiy ISO/IEC 18004 QR-matritsa (qrcode kutubxona) — vektor to'rtburchak
      // sifatida chiziladi (PDF darajasida shrift/rasm kerak emas, aniq va o'lchamsiz).
      const qrPayload = buildQrPayload({ barcode: data.barcode, materialCode: data.materialCode, batchNumber: data.batchNumber });
      if (qrPayload) {
        const qr = generateQrMatrix(qrPayload);
        const moduleSize = LABEL_QR_MODULE_PT;
        const qrPxSize = qr.size * moduleSize;
        const qrX = page.getWidth() - qrPxSize - 4;
        const qrTopY = h - 20;
        const qrBottomY = qrTopY - qrPxSize;
        for (let row = 0; row < qr.size; row++) {
          for (let col = 0; col < qr.size; col++) {
            if (!qr.isDark(row, col)) continue;
            page.drawRectangle({
              x: qrX + col * moduleSize,
              y: qrBottomY + (qr.size - 1 - row) * moduleSize,
              width: moduleSize,
              height: moduleSize,
              color: rgb(0, 0, 0),
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    });
  }

  async sendToPrinter(content: string, ip: string, port: number = PRINTER_DEFAULT_PORT): Promise<boolean> {
    return new Promise((resolve) => {
      const client = new net.Socket();
      client.setTimeout(DEFAULT_TIMEOUT_MS);

      client.connect(port, ip, () => {
        // latin1 (binary 1:1 bayt xaritalash) — ZPL/EPL bayt-oqim protokol;
        // ASCII (<128) uchun utf8 bilan bir xil, lekin EPL `GW` grafik buyrug'i
        // ichidagi xom QR-bitmap baytlarini (0-255) buzmasdan uzatadi.
        client.write(content, 'latin1', () => {
          client.end();
          resolve(true);
        });
      });

      client.on('error', (err) => {
        this.logger.warn(`Printer ${ip}:${port} xato: ${(err as Error).message}`);
        client.destroy();
        resolve(false);
      });

      client.on('timeout', () => {
        this.logger.warn(`Printer ${ip}:${port} timeout`);
        client.destroy();
        resolve(false);
      });
    });
  }

  async getPrinterConfig(): Promise<Result<PrinterConfig | null, AppError>> {
    return safeCall(async () => {
      const row = await this.printerConfigRepo.getActiveConfig();
      if (!row) throw new NotFoundException(await this.i18n.t('errors.printerConfigNotFound'));

      const rd: Record<string, unknown> = (row.data ?? {}) as Record<string, unknown>;
      const ip = (rd['printer_ip'] as string) ?? '';
      if (!ip) throw new NotFoundException(await this.i18n.t('errors.printerIpNotSpecified'));

      return {
        id:     Number(rd['id']),
        name:   (rd['name'] as string) ?? '',
        ip,
        port:   Number(rd['printer_port'] ?? PRINTER_DEFAULT_PORT),
        format: ((rd['print_format'] as string) ?? 'ZPL') as LabelFormat,
      };
    });
  }
}
