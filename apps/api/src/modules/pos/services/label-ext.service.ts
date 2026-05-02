import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PRINTER_DEFAULT_PORT, DEFAULT_TIMEOUT_MS, MM_TO_PT_RATIO, DEFAULT_BARCODE } from '@common/constants/app.constants';
import { Result, AppError, safeCall } from '@common/result';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as net from 'net';
import type { LabelData, LabelFormat, PrinterConfig } from './label.service';
import { PosPrinterConfigRepository } from './pos-printer-config.repository';
@Injectable()
export class LabelExtService {
  private readonly logger = new Logger(LabelExtService.name);

  constructor(private readonly printerConfigRepo: PosPrinterConfigRepository) {}

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
  
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    });
  }

  async sendToPrinter(content: string, ip: string, port: number = PRINTER_DEFAULT_PORT): Promise<boolean> {
    return new Promise((resolve) => {
      const client = new net.Socket();
      client.setTimeout(DEFAULT_TIMEOUT_MS);

      client.connect(port, ip, () => {
        client.write(content, 'utf8', () => {
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
      if (!row) throw new NotFoundException('Aktiv printer konfiguratsiyasi topilmadi');

      const rd: Record<string, unknown> = (row.data ?? {}) as Record<string, unknown>;
      const ip = (rd['printer_ip'] as string) ?? '';
      if (!ip) throw new NotFoundException('Printer IP manzili ko\'rsatilmagan');

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
