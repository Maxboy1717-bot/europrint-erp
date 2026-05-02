/**
 * pdf-generation.processor.ts — BullMQ 'pdf-generation' navbat workeri.
 * pdf-lib bilan PDF yaratish.
 * ObjectStorageService.uploadBuffer() orqali object storage (GCS) ga yuklaydi.
 * PRIVATE_OBJECT_DIR sozlanmagan bo'lsa — /tmp ga saqlaydi (fallback).
 * concurrency: 1 — PDF yaratish resurs ko'p talab qiladi
 */
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PDFDocument, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { QUEUE_NAMES, backoffDelay } from '../queue.constants';
import { ObjectStorageService } from '../../../lib/objectStorage';

export interface PdfJobData {
  templateName: string;
  data: Record<string, unknown>;
  outputKey: string;
  notifyEmail?: string;
}

export interface PdfJobResult {
  storagePath: string;
  sizeBytes: number;
  storageType: 'object-storage' | 'tmp';
}

@Processor(QUEUE_NAMES.PDF_GENERATION, { concurrency: 1 })
export class PdfGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfGenerationProcessor.name);
  private readonly objectStorage = new ObjectStorageService();

  constructor(private readonly cfg: ConfigService) {
    super();
  }

  async process(job: Job<PdfJobData>): Promise<PdfJobResult> {
    const delay = backoffDelay(job.attemptsMade);
    this.logger.debug(
      `[pdf] Job #${job.id} — shablon: ${job.data.templateName}, urinish: ${job.attemptsMade}, backoff: ${delay}ms`,
    );

    try {
      const result = await this.generateAndStore(job.data);
      this.logger.log(
        `[pdf] Job #${job.id} muvaffaqiyatli bajarildi → ${result.storagePath} (${result.sizeBytes} bytes, ${result.storageType})`,
      );
      return result;
    } catch (err) {
      this.logger.error(`[pdf] Job #${job.id} xato: ${String(err)}`);
      throw err;
    }
  }

  private async generateAndStore(data: PdfJobData): Promise<PdfJobResult> {
    if (!data.outputKey || data.outputKey.trim().length === 0) {
      throw new Error('[pdf] outputKey bo\'sh — saqlash uchun fayl nomi talab qilinadi');
    }
    const pdfBytes = await this.buildPdf(data);
    const safeKey = data.outputKey.replace(/[^a-z0-9._-]/gi, '_');

    const privateDir = this.cfg.get<string>('PRIVATE_OBJECT_DIR');
    if (privateDir) {
      return await this.uploadToObjectStorage(pdfBytes, safeKey);
    }

    return this.saveToTmp(pdfBytes, safeKey);
  }

  private async uploadToObjectStorage(
    pdfBytes: Uint8Array,
    safeKey: string,
  ): Promise<PdfJobResult> {
    const objectKey = `pdf/${safeKey}.pdf`;

    const storagePath = await this.objectStorage.uploadBuffer(
      pdfBytes,
      objectKey,
      'application/pdf',
      { cacheControl: 'private, max-age=3600' },
    );

    this.logger.log(`[pdf] Object storage ga yuklandi: ${storagePath}`);
    return { storagePath, sizeBytes: pdfBytes.length, storageType: 'object-storage' };
  }

  private saveToTmp(pdfBytes: Uint8Array, safeKey: string): PdfJobResult {
    const outputPath = path.join('/tmp', `${safeKey}.pdf`);
    fs.writeFileSync(outputPath, pdfBytes);
    this.logger.warn(
      `[pdf] PRIVATE_OBJECT_DIR sozlanmagan — /tmp ga saqlandi (vaqtinchalik): ${outputPath}`,
    );
    return { storagePath: outputPath, sizeBytes: pdfBytes.length, storageType: 'tmp' };
  }

  private async buildPdf(data: PdfJobData): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    const lineHeight = 22;
    const pageWidth = 595;
    const pageHeight = 842;

    let currentPage: PDFPage = doc.addPage([pageWidth, pageHeight]);
    const { width, height } = currentPage.getSize();

    currentPage.drawRectangle({
      x: 0, y: height - 60,
      width, height: 60,
      color: rgb(0.067, 0.067, 0.157),
    });

    currentPage.drawText('EuroPrint ERP', {
      x: margin, y: height - 38,
      size: 20, font: boldFont,
      color: rgb(1, 0.365, 0.180),
    });

    currentPage.drawText(`Shablon: ${data.templateName}`, {
      x: margin, y: height - 55,
      size: 10, font,
      color: rgb(0.8, 0.8, 0.8),
    });

    currentPage.drawText(data.templateName, {
      x: margin, y: height - 100,
      size: 16, font: boldFont,
      color: rgb(0.067, 0.067, 0.157),
    });

    currentPage.drawText(`Sana: ${new Date().toLocaleDateString('uz-UZ')}`, {
      x: margin, y: height - 122,
      size: 11, font,
      color: rgb(0.4, 0.4, 0.4),
    });

    currentPage.drawLine({
      start: { x: margin, y: height - 135 },
      end: { x: width - margin, y: height - 135 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    let y = height - 160;
    const entries = Object.entries(data.data);

    for (const [key, value] of entries) {
      if (y < margin + 60) {
        currentPage = doc.addPage([pageWidth, pageHeight]);
        y = currentPage.getSize().height - margin;
      }

      currentPage.drawText(`${key}:`, {
        x: margin, y,
        size: 10, font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      currentPage.drawText(String(value ?? '—'), {
        x: margin + 160, y,
        size: 10, font,
        color: rgb(0.3, 0.3, 0.3),
      });

      y -= lineHeight;
    }

    currentPage.drawText(
      `EuroPrint LLC · ${data.outputKey} · Avtomatik yaratilgan`,
      {
        x: margin, y: 30,
        size: 8, font,
        color: rgb(0.6, 0.6, 0.6),
      },
    );

    return doc.save();
  }
}
