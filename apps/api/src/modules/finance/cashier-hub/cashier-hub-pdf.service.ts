/**
 * @module cashier-hub-pdf.service
 * @description CASHIER-HUB kunlik PDF (daily Z-report) — pdf-lib, same draw()-line pattern as
 *   HrPdfGeneratorService (apps/api/src/common/pdf/hr-pdf-generator.service.ts). Egasi §A+.18b
 *   "Kassa harakati = PDF" — kassirga kunlik umumiy hisobot (jami kirim/chiqim/qoldiq/farq).
 * @layer Application (Finance)
 */

import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { MovementTypeTally } from './i-cashier-hub.repo';

export interface DailyCashReportPayload {
  shiftId: number;
  cashierName: string;
  status: string;
  openedAt: Date | string | null;
  closedAt: Date | string | null;
  openingAmount: number;
  cashIn: number;
  cashOut: number;
  closedAmount: number | null;
  expectedAmount: number;
  variance: number | null;
  movementCount: number;
  byType: MovementTypeTally[];
}

const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  cash_in: 'Kirim',
  cash_out: 'Chiqim',
  salary_payout: 'Ish haqi',
  advance: 'Avans',
  expense: 'Xarajat',
};

@Injectable()
export class CashierHubPdfService {
  async generateDailyCashReport(payload: DailyCashReportPayload): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const draw = (text: string, opts?: { x?: number; bold?: boolean; size?: number; color?: ReturnType<typeof rgb> }) => {
      page.drawText(text, {
        x: opts?.x ?? 50, y,
        size: opts?.size ?? 11,
        font: opts?.bold ? bold : font,
        color: opts?.color ?? rgb(0, 0, 0),
      });
      y -= (opts?.size ?? 11) + 6;
    };

    draw('EuroPrint — Kunlik Kassa Hisoboti (Z-hisobot)', { bold: true, size: 18 });
    draw(`Smena #${payload.shiftId}`, { size: 12, color: rgb(0.4, 0.4, 0.4) });
    y -= 6;
    draw(`Kassir:   ${payload.cashierName}`, { bold: true });
    draw(`Ochilgan: ${this.fmtDateTime(payload.openedAt)}`);
    draw(`Yopilgan: ${payload.closedAt ? this.fmtDateTime(payload.closedAt) : '— (smena hali ochiq, X-hisobot)'}`);
    draw(`Holat:    ${payload.status === 'open' ? 'Ochiq' : 'Yopilgan'}`);
    y -= 10;

    draw('Naqd holati:', { bold: true, size: 13 });
    draw(`  Boshlang'ich summa: ${this.fmtUzs(payload.openingAmount)}`);
    draw(`  Jami kirim:         ${this.fmtUzs(payload.cashIn)}`, { color: rgb(0, 0.5, 0) });
    draw(`  Jami chiqim:        ${this.fmtUzs(payload.cashOut)}`, { color: rgb(0.8, 0, 0) });
    draw(`  Kutilgan qoldiq:    ${this.fmtUzs(payload.expectedAmount)}`, { bold: true });
    if (payload.closedAmount !== null) {
      draw(`  Faktik (sanalgan):  ${this.fmtUzs(payload.closedAmount)}`);
      const variance = payload.variance ?? 0;
      draw(
        `  Farq (variance):    ${variance > 0 ? '+' : ''}${this.fmtUzs(variance)}`,
        { bold: true, color: variance === 0 ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0) },
      );
    }
    y -= 10;

    draw(`Harakatlar (jami ${payload.movementCount} ta) — turlar bo'yicha:`, { bold: true, size: 13 });
    if (payload.byType.length === 0) {
      draw('  Bu smenada hali harakat qayd etilmagan.', { color: rgb(0.5, 0.5, 0.5) });
    } else {
      for (const t of payload.byType) {
        const label = MOVEMENT_TYPE_LABEL[t.type] ?? t.type;
        draw(`  ${label.padEnd(14, ' ')} ${String(t.count).padStart(3, ' ')} ta   ${this.fmtUzs(t.total)}`);
      }
    }
    y -= 20;
    draw(`Hisobot: ${this.fmtDateTime(new Date())}`, { size: 9, color: rgb(0.5, 0.5, 0.5) });
    draw('Elektron imzo: kassir ERP login orqali tasdiqlangan', { size: 9, color: rgb(0.5, 0.5, 0.5) });

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }

  private fmtUzs(n: number): string {
    return `${Math.round(n).toLocaleString('en-US')} so'm`;
  }
  private fmtDateTime(d: Date | string | null): string {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return '—';
    return `${date.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })} ${date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
  }
}
