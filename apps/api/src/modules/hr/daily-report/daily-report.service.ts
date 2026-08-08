/**
 * @module daily-report.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { HrV2Events } from '../events/hr-v2-events';
import { safeCall, Result, AppError } from '@common/result';
import { DailyReportRepository } from './daily-report.repository';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
// pdf-lib's StandardFonts (WinAnsi/CP1252 encoding) cannot render Cyrillic (U+0400-U+04FF) —
// drawText() throws "WinAnsi cannot encode ..." which safeCall swallows into a 0-byte/failed
// PDF (Q-40: "runs, but wrong"). Reuse the same fix already applied across the codebase
// (sd-invoice-pdf.service.ts, qc-certificate-pdf.service.ts, pos-pdf.service.ts, etc.) instead
// of inventing a second approach — see @common/pdf/pdf-safe-text.helper for the rationale.
import { toPdfSafeText } from '@common/pdf/pdf-safe-text.helper';

@Injectable()
export class DailyReportService {
  private readonly logger = new Logger(DailyReportService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: DailyReportRepository,
    private readonly i18n: I18nService,
  ) {}

  async submitReport(dto: {
    employeeId: number;
    reportDate?: string;
    tasksCompleted?: string;
    metrics?: string;
    tomorrowPlan?: string;
    // Raw metric fields — assembled into metrics JSON if metrics not provided
    blockers?: string;
    mood?: string;
    productiveHours?: number;
  }) {
    return safeCall(async () => {
      const reportDate = dto.reportDate || _time.now().toISOString().split('T')[0];
      const tasksCompleted = dto.tasksCompleted || '';
      // Assemble metrics JSON from structured fields when raw string not supplied
      const metrics = dto.metrics || (
        (dto.blockers || dto.mood || dto.productiveHours)
          ? JSON.stringify({ blockers: dto.blockers, mood: dto.mood, productiveHours: dto.productiveHours })
          : undefined
      );

      const row = await this.repo.upsertReport({
        employeeId: dto.employeeId,
        reportDate,
        tasksCompleted,
        metrics,
        tomorrowPlan: dto.tomorrowPlan,
      });

      const rowData = (row?.ok ? row.data as { id?: number } : {});
      this.eventEmitter.emit(HrV2Events.DAILY_REPORT_SUBMITTED, {
        employeeId: dto.employeeId,
        reportDate,
        reportId: rowData?.id,
      });

      return row;
    });
  }

  async hrOverride(
    reportId: number,
    hrUserId: number,
    reason: string,
    newStatus?: string,
    isAutoAbsent?: boolean,
  ): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const previousStatus = await this.repo.getReportStatus(reportId);
      // Bug fixed: `newStatus` used to never reach here (controller never forwarded it),
      // so this always fell through to the `|| 'submitted'` fallback — every override
      // silently reset status to 'submitted' regardless of what HR actually chose. Now
      // that the controller threads the real value through, only fall back when the
      // caller genuinely didn't choose a status (keep whatever it already was).
      const finalStatus = newStatus || (previousStatus.ok ? (previousStatus.data as string) : 'submitted');
      const updated = await this.repo.updateReportStatus(reportId, finalStatus, isAutoAbsent);
      // `updated` is a Result<Row|null> — checking truthiness of the Result wrapper itself
      // (as the old code did) is always true, so a missing report never actually 404'd.
      if (!updated.ok || !updated.data) {
        throw new NotFoundException(await this.i18n.t('errors.dailyReportNotFound', { args: { id: reportId } }));
      }
      await this.repo.insertAudit(
        reportId,
        hrUserId,
        (previousStatus.ok ? (previousStatus.data as string) : undefined) as string,
        finalStatus,
        reason,
      );
      return updated.data;
    });
  }

  async getStats(date?: string) {
    return safeCall(async () => {
      const reportDate = date || _time.now().toISOString().split('T')[0];
      return this.repo.getStats(reportDate);
    });
  }

  async getByEmployee(employeeId: number, limit = 30) {
    return this.repo.getByEmployee(employeeId, limit);
  }

  async getByDate(date: string, type: 'all' | 'operator' | 'office' = 'all', limit = 100) {
    return this.repo.getByDate(date, type, limit);
  }

  async getByDepartment(departmentId: number, date: string) {
    return this.repo.getByDepartment(departmentId, date);
  }

  async generatePdf(reportId: number): Promise<Result<Uint8Array, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findByIdWithEmployee(reportId);
      if (!r.ok || !r.data) throw new NotFoundException(await this.i18n.t('errors.dailyReportNotFound', { args: { id: reportId } }));
      const row = r.data as Record<string, unknown>;

      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595.28, 841.89]); // A4
      const font     = await pdf.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const { width, height } = page.getSize();
      const margin = 50;
      let y = height - margin;

      // Header bar
      page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: rgb(0.13, 0.47, 0.71) });
      page.drawText(toPdfSafeText('EuroPrint ERP'), { x: margin, y: height - 42, size: 20, font: fontBold, color: rgb(1, 1, 1) });
      page.drawText(toPdfSafeText('Kunlik Hisobot'), { x: width - 170, y: height - 42, size: 14, font, color: rgb(0.9, 0.9, 0.9) });

      y = height - 80;

      // toPdfSafeText: `value` is dynamic DB content (employee_name/position_name/... may be
      // entered in Cyrillic — Uzbek uz-cyr or Russian) — pdf-lib StandardFonts (WinAnsi) would
      // otherwise crash on the very first Cyrillic character (bug fixed here).
      const line = (label: string, value: string, bold = false) => {
        page.drawText(toPdfSafeText(`${label}:`), { x: margin, y, size: 10, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(toPdfSafeText(value || '—'), { x: 200, y, size: 10, font: bold ? fontBold : font, color: rgb(0, 0, 0) });
        y -= 18;
      };

      const section = (title: string) => {
        y -= 8;
        page.drawRectangle({ x: margin, y: y - 2, width: width - 2 * margin, height: 18, color: rgb(0.93, 0.95, 0.98) });
        page.drawText(toPdfSafeText(title), { x: margin + 5, y: y + 1, size: 10, font: fontBold, color: rgb(0.13, 0.47, 0.71) });
        y -= 22;
      };

      section('Xodim Ma\'lumotlari');
      line('Xodim', String(row['employee_name'] ?? ''));
      line('Lavozim', String(row['position_name'] ?? ''));
      line('Bo\'lim', String(row['department_name'] ?? ''));

      section('Hisobot Ma\'lumotlari');
      line('Hisobot sanasi', String(row['report_date'] ?? ''));
      line('Status', String(row['status'] ?? ''));
      line('Topshirilgan', row['submitted_at'] ? new Date(String(row['submitted_at'])).toLocaleString('uz-UZ') : '—');

      section('Bajarilgan Ishlar');
      // toPdfSafeText: tasks_completed is free-text HR/employee input — commonly typed in
      // Cyrillic (uz-cyr or ru locale). Word-wrap on the transliterated text so the ~75-char
      // line width stays consistent with what actually gets drawn.
      const tasks = toPdfSafeText(String(row['tasks_completed'] ?? ''));
      // Word-wrap tasks text
      const words = tasks.split(' ');
      let lineText = '';
      for (const word of words) {
        const testLine = lineText ? lineText + ' ' + word : word;
        if (testLine.length > 75) {
          page.drawText(lineText, { x: margin, y, size: 10, font, color: rgb(0, 0, 0) });
          y -= 15;
          lineText = word;
        } else {
          lineText = testLine;
        }
      }
      if (lineText) { page.drawText(lineText, { x: margin, y, size: 10, font, color: rgb(0, 0, 0) }); y -= 15; }

      const metricsStr = String(row['metrics'] ?? '');
      if (metricsStr) {
        section('Metriklar');
        page.drawText(toPdfSafeText(metricsStr.slice(0, 200)), { x: margin, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
        y -= 15;
      }

      const tomorrowPlan = String(row['tomorrow_plan'] ?? '');
      if (tomorrowPlan) {
        section('Ertangi Reja');
        page.drawText(toPdfSafeText(tomorrowPlan.slice(0, 200)), { x: margin, y, size: 10, font, color: rgb(0, 0, 0) });
        y -= 15;
      }

      // Footer
      page.drawLine({ start: { x: margin, y: 50 }, end: { x: width - margin, y: 50 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
      page.drawText(toPdfSafeText(`EuroPrint ERP — Kunlik Hisobot #${reportId} — ${new Date().toLocaleString('uz-UZ')}`), {
        x: margin, y: 35, size: 8, font, color: rgb(0.5, 0.5, 0.5),
      });

      return pdf.save();
    });
  }

  @Cron('30 15 * * 1-6')
  async sendDailyReportReminder() {
    return safeCall(async () => {
      const today = _time.now().toISOString().split('T')[0];
      const BATCH = 100;
      let offset = 0;
      let totalNotified = 0;

      while (true) {
        const rows = await this.repo.findEmployeesWithoutReport(today, BATCH, offset);
        if (!rows.ok || rows.data.length === 0) break;

        for (const emp of rows.data) {
          this.eventEmitter.emit(HrV2Events.DAILY_REPORT_REMINDER, {
            employeeId: emp.id,
            reportDate: today,
          });
        }
        totalNotified += rows.data.length;
        if (rows.data.length < BATCH) break;
        offset += BATCH;
      }
      this.logger.log(`DailyReport reminder: ${totalNotified} employees notified`);
    });
  }

  @Cron('0 16 * * 1-6')
  async markAbsentReports() {
    return safeCall(async () => {
      const today = _time.now().toISOString().split('T')[0];
      await this.repo.markAbsentForDate(today);
      this.logger.log(`markAbsentReports: processed ${today}`);

      // 30-minute escalation: reminder was sent at 15:30; deadline is 16:00.
      // Query current stats to get absent count, then escalate to HR.
      const statsR = await this.repo.getStats(today);
      const absentCount = statsR.ok
        ? (statsR.data as { absent_count?: number }).absent_count ?? 0
        : 0;
      this.eventEmitter.emit(HrV2Events.DAILY_REPORT_OVERDUE, {
        reportDate:  today,
        absentCount,
        escalatedAt: _time.now().toISOString(),
      });
    });
  }
}
