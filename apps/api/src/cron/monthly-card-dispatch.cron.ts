/**
 * @module monthly-card-dispatch.cron
 * @description 1st day of each month at 09:00 — build monthly cards for ALL
 *   active employees for the previous month and Telegram-send PDF to each.
 *
 *   Service: EmployeeMonthlyCardService.buildCard
 *   PDF:     HrPdfGeneratorService.generateMonthlyCard
 *
 * @layer Cron (HR)
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TelegramService } from '../telegram/telegram.service';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { EmployeeMonthlyCardService } from '../modules/hr/employees/employee-monthly-card.service';
import { HrPdfGeneratorService } from '../common/pdf/hr-pdf-generator.service';

interface EmployeeRow {
  id: number;
  full_name: string;
  telegram_chat_id: string | null;
}

@Injectable()
export class MonthlyCardDispatchCron {
  private readonly logger = new Logger(MonthlyCardDispatchCron.name);

  constructor(
    @Optional() private readonly telegram: TelegramService,
    private readonly cardSvc: EmployeeMonthlyCardService,
    private readonly pdfSvc: HrPdfGeneratorService,
  ) {}

  @Cron('0 9 1 * *')  // 09:00 on the 1st of every month
  async dispatchMonthlyCards(): Promise<void> {
    this.logger.log('Running monthly-card-dispatch cron...');
    const now = new Date();
    // Previous month
    const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 12 : now.getMonth();

    try {
      const rows = await db.execute(sql`
        SELECT
          e.id,
          (e.first_name || ' ' || e.last_name) AS full_name,
          e.telegram_chat_id
        FROM employees e
        WHERE e.status = 'active' AND e.deleted_at IS NULL
      `);
      const employees = (rows as unknown as { rows: EmployeeRow[] }).rows;
      this.logger.log(`Building monthly cards for ${employees.length} employees (period ${month}/${year})`);

      let success = 0;
      let failed  = 0;
      for (const emp of employees) {
        try {
          const r = await this.cardSvc.buildCard(emp.id, year, month);
          if (!r.ok) { failed++; continue; }
          const card = r.data;

          // Generate PDF
          const pdfBuf = await this.pdfSvc.generateMonthlyCard({
            fullName: card.fullName, positionName: card.positionName,
            departmentName: card.departmentName, year, month,
            daysPresent: card.daysPresent, daysLate: card.daysLate,
            daysAbsent: card.daysAbsent, bonusUzs: card.bonusUzs,
            fineUzs: card.fineUzs, abcCategory: card.abcCategory,
            posBalance: card.posBalance, netSalaryUzs: card.netSalaryUzs,
          });

          // Save PDF bytes to the card record
          await db.execute(sql`
            UPDATE employee_monthly_cards
            SET pdf_data = ${pdfBuf}
            WHERE employee_id = ${emp.id}
              AND period_year = ${year} AND period_month = ${month}
          `);

          // Send Telegram (text summary; PDF as document if telegram supports it)
          if (emp.telegram_chat_id && this.telegram) {
            await this.telegram.sendMessage(
              emp.telegram_chat_id,
              `📊 Oylik hisobot kartochkasi ${month}/${year} tayyor.\n\n${card.summaryText}`,
            ).catch(() => { /* noop */ });
          }
          success++;
        } catch (err) {
          this.logger.warn(`Card build failed for emp ${emp.id}: ${String(err)}`);
          failed++;
        }
      }
      this.logger.log(`Monthly cards dispatched: ${success} ok, ${failed} failed`);
    } catch (err) {
      this.logger.error(`monthly-card-dispatch cron failed: ${String(err)}`);
    }
  }
}
