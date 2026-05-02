/**
 * label-print.processor.ts — BullMQ 'label-print' navbat workeri.
 * ZPL format bilan TCP socket orqali label printer ga yuborish.
 * PRINTER_HOST:PRINTER_PORT (default: 9100) — ConfigService orqali.
 * concurrency: 2
 */
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';
import { QUEUE_NAMES, backoffDelay } from '../queue.constants';

export interface LabelPrintJobData {
  printerId: string;
  labelTemplate: string;
  items: Array<{ sku: string; qty: number; barcode: string }>;
  copies?: number;
}

const DEFAULT_PRINTER_PORT = 9100;
const TCP_TIMEOUT_MS = 5_000;

@Processor(QUEUE_NAMES.LABEL_PRINT, { concurrency: 2 })
export class LabelPrintProcessor extends WorkerHost {
  private readonly logger = new Logger(LabelPrintProcessor.name);

  constructor(private readonly cfg: ConfigService) {
    super();
  }

  async process(job: Job<LabelPrintJobData>): Promise<void> {
    const delay = backoffDelay(job.attemptsMade);
    this.logger.debug(
      `[label] Job #${job.id} — printer: ${job.data.printerId}, items: ${job.data.items.length}, backoff: ${delay}ms`,
    );

    try {
      await this.printLabels(job.data);
      this.logger.log(
        `[label] Job #${job.id} muvaffaqiyatli: ${job.data.items.length} label chiqarildi`,
      );
    } catch (err) {
      this.logger.error(`[label] Job #${job.id} xato: ${String(err)}`);
      throw err;
    }
  }

  private async printLabels(data: LabelPrintJobData): Promise<void> {
    const printerHost = this.cfg.get<string>('PRINTER_HOST');
    const printerPort = Number(this.cfg.get<string>('PRINTER_PORT') ?? String(DEFAULT_PRINTER_PORT));

    if (!printerHost) {
      throw new Error('[label] PRINTER_HOST muhit o\'zgaruvchisi sozlanmagan — TCP printer ulanishi uchun talab qilinadi');
    }

    const items = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0) {
      throw new Error('[label] items bo\'sh — chiqarish uchun kamida bitta label talab qilinadi');
    }

    const zpl = this.buildZpl(data);

    await this.sendToTcpPrinter(printerHost, printerPort, zpl);
    this.logger.log(
      `[label] ${items.length} label yuborildi: ${printerHost}:${printerPort}`,
    );
  }

  /**
   * ZPL (Zebra Programming Language) label generatsiya.
   * Har item + copies uchun bitta label bloki.
   */
  private buildZpl(data: LabelPrintJobData): string {
    const copies = Math.max(1, data.copies ?? 1);
    const items = Array.isArray(data.items) ? data.items : [];

    return items
      .flatMap((item) =>
        Array.from({ length: copies }, () =>
          [
            '^XA',                                  // Start Format
            '^FO50,30^A0N,28,28',                   // Font
            `^FD${item.sku}^FS`,                    // SKU
            '^FO50,70^BY3^BCN,80,Y,N,N',           // Barcode
            `^FD${item.barcode}^FS`,                // Barcode data
            '^FO50,170^A0N,24,24',                  // Font
            `^FDQty: ${item.qty}^FS`,              // Quantity
            '^FO50,200^A0N,20,20',
            `^FDTemplate: ${data.labelTemplate}^FS`,
            '^XZ',                                  // End Format
          ].join(''),
        ),
      )
      .join('\n');
  }

  /**
   * TCP socket orqali ZPL string'ni printer ga yuborish.
   * Timeout: 5 sekund.
   */
  private sendToTcpPrinter(host: string, port: number, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(TCP_TIMEOUT_MS);
      let settled = false;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        fn();
      };

      socket.connect(port, host, () => {
        socket.write(data, 'utf8', (writeErr) => {
          if (writeErr) {
            settle(() => reject(writeErr));
            return;
          }
          socket.end(() => settle(() => resolve()));
        });
      });

      socket.on('error', (err) => settle(() => reject(err)));
      socket.on('timeout', () =>
        settle(() => reject(new Error(`TCP timeout ${TCP_TIMEOUT_MS}ms: ${host}:${port}`))),
      );
    });
  }
}
