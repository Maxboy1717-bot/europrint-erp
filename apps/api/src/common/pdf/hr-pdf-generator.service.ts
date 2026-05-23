/**
 * @module hr-pdf-generator.service
 * @description Generate HR/POS PDF documents using pdf-lib (server-friendly,
 *   pure-JS, no native deps). Returns Buffer ready for BYTEA/HTTP.
 *
 * @layer Service (common)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface OperatorInvoicePayload {
  fullName: string;
  positionName: string | null;
  machineName: string | null;
  periodStart: Date;
  periodEnd: Date;
  unitsProduced: number;
  unitsDefective: number;
  hourlyRate: number;
  posDebtUzs: number;
}

interface MonthlyCardPayload {
  fullName: string;
  positionName: string | null;
  departmentName: string | null;
  year: number;
  month: number;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  bonusUzs: number;
  fineUzs: number;
  abcCategory: string | null;
  posBalance: number;
  netSalaryUzs: number;
}

@Injectable()
export class HrPdfGeneratorService {
  private readonly logger = new Logger(HrPdfGeneratorService.name);

  async generateOperatorInvoice(payload: OperatorInvoicePayload): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);  // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const defectRate = payload.unitsProduced > 0
      ? (payload.unitsDefective / payload.unitsProduced) * 100 : 0;

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

    draw('EuroPrint — Operator Hourly Invoice', { bold: true, size: 18 });
    y -= 6;
    draw(`${this.fmtDate(payload.periodEnd)} ${payload.periodEnd.getHours()}:00`, { size: 10, color: rgb(0.4, 0.4, 0.4) });
    y -= 10;
    draw(`Xodim:    ${payload.fullName}`, { bold: true });
    draw(`Lavozim:  ${payload.positionName ?? '-'}`);
    draw(`Mashina:  ${payload.machineName ?? '-'}`);
    draw(`Davr:     ${this.fmtTime(payload.periodStart)} - ${this.fmtTime(payload.periodEnd)}`);
    y -= 10;
    draw('Natijalar:', { bold: true, size: 13 });
    draw(`  Ishlab chiqarildi:  ${payload.unitsProduced} dona`);
    draw(`  Brak:               ${payload.unitsDefective} (${defectRate.toFixed(1)}%)`);
    draw(`  Soatlik haq:        ${payload.hourlyRate.toLocaleString('en-US')} UZS`);
    if (payload.posDebtUzs < 0) {
      draw(`  POS qarz:           ${Math.abs(payload.posDebtUzs).toLocaleString('en-US')} UZS`, { color: rgb(0.8, 0, 0) });
    }
    y -= 20;
    draw(`Hisobot: ${this.fmtDateTime(new Date())}`, { size: 9, color: rgb(0.5, 0.5, 0.5) });

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }

  async generateMonthlyCard(payload: MonthlyCardPayload): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
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

    draw('EuroPrint — Oylik Hisobot Kartochkasi', { bold: true, size: 18 });
    draw(`${payload.month}/${payload.year}`, { size: 13, color: rgb(0.4, 0.4, 0.4) });
    y -= 10;
    draw(`Xodim:    ${payload.fullName}`, { bold: true });
    draw(`Lavozim:  ${payload.positionName ?? '-'}`);
    draw(`Bolim:    ${payload.departmentName ?? '-'}`);
    y -= 10;
    draw('Davomat:', { bold: true, size: 13 });
    draw(`  Ish kunlari:    ${payload.daysPresent}`);
    draw(`  Kech kelishlar: ${payload.daysLate}`);
    draw(`  Kelmaganlar:    ${payload.daysAbsent}`);
    y -= 10;
    draw('Moliya:', { bold: true, size: 13 });
    draw(`  Mukofot:    ${payload.bonusUzs.toLocaleString('en-US')} UZS`);
    draw(`  Jarima:     ${payload.fineUzs.toLocaleString('en-US')} UZS`, { color: payload.fineUzs > 0 ? rgb(0.8, 0, 0) : rgb(0, 0, 0) });
    draw(`  POS balans: ${payload.posBalance.toLocaleString('en-US')} UZS`, { color: payload.posBalance < 0 ? rgb(0.8, 0, 0) : rgb(0, 0.5, 0) });
    draw(`  ABC:        ${payload.abcCategory ?? 'Belgilanmagan'}`);
    y -= 6;
    draw(`  SOF OYLIK: ${payload.netSalaryUzs.toLocaleString('en-US')} UZS`, { bold: true, size: 13, color: rgb(0, 0.4, 0) });
    y -= 20;
    draw(`Hisobot: ${this.fmtDateTime(new Date())}`, { size: 9, color: rgb(0.5, 0.5, 0.5) });

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }

  private fmtDate(d: Date): string {
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  private fmtTime(d: Date): string {
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  }
  private fmtDateTime(d: Date): string {
    return `${this.fmtDate(d)} ${this.fmtTime(d)}`;
  }
}
