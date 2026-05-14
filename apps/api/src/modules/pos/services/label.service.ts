/**
 * @module label.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { DEFAULT_BARCODE } from '@common/constants/app.constants';
/**
 * POS — Label Service
 *
 * Thermal label generatsiya (Zebra/Eltron printerlar uchun):
 *  - ZPL format (Zebra ZPL II — ZPL2 standard)
 *  - EPL format (Eltron/Zebra EPL2 — eski printerlar)
 *  - PDF format (pdf-lib — preview va PDF printer)
 *
 * Label tarkibi: material nomi, barcode, partiya raqami, miqdor, sana
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { LabelExtService } from './label-ext.service';
import { LabelRepository } from './label.repository';

export type LabelFormat = 'ZPL' | 'EPL' | 'PDF';

export interface LabelData {
  materialCardId?: number;
  materialName: string;
  materialCode: string;
  barcode: string;
  batchNumber?: string;
  quantity?: number;
  unitOfMeasure?: string;
  productionDate?: string;
  expiryDate?: string;
  warehouseName?: string;
  date: string;
}

export interface PrinterConfig {
  id?: number;
  name?: string;
  ip: string;
  port: number;
  format: LabelFormat;
}

export interface LabelResult {
  format: LabelFormat;
  content: string | Buffer;
  sentToPrinter: boolean;
  printerIp?: string;
}

@Injectable()
export class LabelService {
  private readonly logger = new Logger(LabelService.name);

  constructor(
    private readonly extSvc: LabelExtService,
    private readonly labelRepo: LabelRepository,
  ) {}

  async getPrinterConfig() { return this.extSvc.getPrinterConfig(); }
  async sendToPrinter(content: string, ip: string, port: number) { return this.extSvc.sendToPrinter(content, ip, port); }

  // ─── Label Ma'lumotlarini Tayyorlash ─────────────────────────────────────

  async fetchLabelData(materialCardId: number, batchId?: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      const mat = await this.labelRepo.getMaterialCard(materialCardId);

      if (!mat) {
        throw new NotFoundException(`Material topilmadi: ${materialCardId}`);
      }

      let batchNumber: string | undefined;
      let quantity: number | undefined;
      let productionDate: string | undefined;
      let expiryDate: string | undefined;
      let warehouseName: string | undefined;

      if (batchId) {
        const b = await this.labelRepo.getBatch(batchId);
        if (b) {
          const bd = (b.data ?? {}) as Record<string, unknown>;
          batchNumber    = bd['batch_number'] as string;
          quantity       = Number(bd['quantity'] ?? 0);
          productionDate = bd['production_date'] ? String(bd['production_date']).substring(0, 10) : undefined;
          expiryDate     = bd['expiry_date'] ? String(bd['expiry_date']).substring(0, 10) : undefined;
          warehouseName  = bd['warehouse_name'] as string;
        }
      }

      const md = (mat.data ?? {}) as Record<string, unknown>;
      return {
        materialCardId: Number(md['material_card_id']),
        materialName:   (md['material_name'] as string) ?? 'N/A',
        materialCode:   (md['material_code'] as string) ?? '',
        barcode:        (md['barcode'] as string) ?? '',
        unitOfMeasure:  (md['unit_of_measure'] as string) ?? 'dona',
        batchNumber, quantity, productionDate, expiryDate, warehouseName,
        date: _time.now().toLocaleDateString('uz-UZ'),
      };
    });
  }

  async fetchLabelDataByMovement(movementId: number): Promise<LabelData[]> {
    const rows = await this.labelRepo.getMovementLines(movementId);
    return (Array.isArray(rows) ? rows : []).map((row: Record<string, unknown>) => ({
      materialCardId: Number(row['material_card_id']),
      materialName:   (row['material_name'] as string) ?? 'N/A',
      materialCode:   (row['material_code'] as string) ?? '',
      barcode:        (row['barcode'] as string) ?? '',
      unitOfMeasure:  (row['unit_of_measure'] as string) ?? 'dona',
      quantity:       Number(row['quantity'] ?? 0),
      batchNumber:    row['batch_number'] as string | undefined,
      productionDate: row['production_date'] as string | undefined,
      expiryDate:     row['expiry_date'] as string | undefined,
      warehouseName:  row['warehouse_name'] as string | undefined,
      date:           _time.now().toLocaleDateString('uz-UZ'),
    }));
  }

  // ─── ZPL Generatsiya (Zebra ZPL II) ──────────────────────────────────────

  generateZpl(data: LabelData): string {
    const name    = this._escapeZpl(data.materialName).substring(0, 30);
    const barcode = data.barcode || DEFAULT_BARCODE;
    const batch   = data.batchNumber ? `Partiya: ${data.batchNumber}` : '';
    const qty     = data.quantity !== undefined ? `Miq: ${data.quantity} ${data.unitOfMeasure ?? ''}` : '';
    const expiry  = data.expiryDate ? `Mudd: ${data.expiryDate}` : '';
    const date    = data.date;

    const barcodeCmd = barcode.match(/^\d{13}$/)
      ? `^FO10,40^BEN,60,Y,N^FD${barcode}^FS`   // EAN-13
      : `^FO10,40^BCN,60,Y,N^FD${barcode}^FS`;  // Code-128

    const lines: string[] = [
      '^XA',
      '^CI28',
      '^LH0,0',
      '^PW400',
      '^LL200',
      `^FO10,10^A0N,20,20^FD${name}^FS`,
      barcodeCmd,
    ];

    if (batch)  lines.push(`^FO10,115^A0N,14,14^FD${batch}^FS`);
    if (qty)    lines.push(`^FO200,115^A0N,14,14^FD${qty}^FS`);
    if (expiry) lines.push(`^FO10,135^A0N,14,14^FD${expiry}^FS`);
    lines.push(`^FO10,155^A0N,12,12^FDEuroPrint | ${date}^FS`);
    lines.push('^XZ');

    return lines.join('\n');
  }

  // ─── EPL Generatsiya (Eltron/Zebra EPL2) ─────────────────────────────────

  generateEpl(data: LabelData, copies: number = 1): string {
    const name    = data.materialName.substring(0, 30);
    const barcode = data.barcode || DEFAULT_BARCODE;
    const batch   = data.batchNumber ? `Partiya: ${data.batchNumber}` : '';
    const qty     = data.quantity !== undefined ? `Miq: ${data.quantity} ${data.unitOfMeasure ?? ''}` : '';
    const expiry  = data.expiryDate ? `Mudd: ${data.expiryDate}` : '';
    const date    = data.date;

    const barcodeCmd = barcode.match(/^\d{13}$/)
      ? `B10,40,0,E,2,2,60,B,"${barcode}"`
      : `B10,40,0,1,2,2,60,B,"${barcode}"`;

    const lines: string[] = [
      'N',
      'q400',
      `A10,10,0,3,1,1,N,"${name}"`,
      barcodeCmd,
    ];

    if (batch)  lines.push(`A10,115,0,2,1,1,N,"${batch}"`);
    if (qty)    lines.push(`A200,115,0,2,1,1,N,"${qty}"`);
    if (expiry) lines.push(`A10,135,0,2,1,1,N,"${expiry}"`);
    lines.push(`A10,155,0,2,1,1,N,"EuroPrint | ${date}"`);
    lines.push(`P${copies}`);

    return lines.join('\n');
  }

  // ─── Asosiy Chop Etish Metodi ─────────────────────────────────────────────

  async printLabel(
    data: LabelData,
    format: LabelFormat,
    printerConfig?: PrinterConfig,
    copies: number = 1,
  ): Promise<LabelResult> {
    let content: string | Buffer;
    let sentToPrinter = false;

    if (format === 'ZPL') {
      const single = this.generateZpl(data);
      content = Array(copies).fill(single).join('\n');
      if (printerConfig?.ip) {
        sentToPrinter = await this.extSvc.sendToPrinter(content as string, printerConfig.ip, printerConfig.port);
      }
    } else if (format === 'EPL') {
      content = this.generateEpl(data, copies);
      if (printerConfig?.ip) {
        sentToPrinter = await this.extSvc.sendToPrinter(content as string, printerConfig.ip, printerConfig.port);
      }
    } else {
      const pdfR = await this.extSvc.generatePdf(data);
      content = pdfR.ok ? (pdfR.data as Buffer) : Buffer.alloc(0);
    }

    return { format, content, sentToPrinter, printerIp: printerConfig?.ip };
  }

  // ─── Harakat Uchun Avtomatik Label ───────────────────────────────────────

  async autoLabelForMovement(movementId: number): Promise<void> {
      const labels = await this.fetchLabelDataByMovement(movementId);
      if (!labels.length) {
        this.logger.warn(`Auto-label: movement=${movementId} — material topilmadi`);
        return;
      }

      const configResult = await this.extSvc.getPrinterConfig();
      const config = configResult.ok ? configResult.data : null;
      const format: LabelFormat = config?.format ?? 'ZPL';

      for (const labelData of labels) {
        if (!labelData.barcode) {
          this.logger.warn(`Barcode yo'q: ${labelData.materialName}, skip.`);
          continue;
        }

        const result = await this.printLabel(labelData, format, config ?? undefined);

        // Print queue ga yozish
        if (labelData.materialCardId) {
          await this.labelRepo.insertPrintQueue(
            labelData.materialCardId, movementId, format,
            config?.ip ?? null, result.sentToPrinter,
          ).catch((err: Error) => this.logger.warn(`Print queue: ${(err as Error).message}`));
        }
      }

      this.logger.log(`Auto-label OK: movement=${movementId} (${labels.length} ta)`);
  }

  // ─── Yordamchi ────────────────────────────────────────────────────────────

  private _escapeZpl(text: string): string {
    return text.replace(/[\\^~]/g, '_');
  }
}
