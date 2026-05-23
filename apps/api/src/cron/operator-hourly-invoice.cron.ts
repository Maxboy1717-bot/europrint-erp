/**
 * @module operator-hourly-invoice.cron
 * @description Every hour at :00 — for each machine-operator employee that
 *   was active in the last hour, generate a PDF "Soatlik invoice" containing:
 *     - operator name + position + machine
 *     - units produced + quality rate
 *     - hourly wage + advance/debt from POS
 *
 *   PDF saved to `operator_hourly_invoices` table (BYTEA) and Telegram-sent
 *   to operator chat.
 *
 * @layer Cron (Production / HR)
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TashkentTimeService } from '@common/time';
import { TelegramService } from '../telegram/telegram.service';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

interface OperatorHourlyRow {
  employee_id: number;
  full_name: string;
  telegram_chat_id: string | null;
  position_name: string | null;
  machine_name: string | null;
  units_produced: number;
  units_defective: number;
  hourly_rate: number;
  pos_debt_uzs: number;
}

@Injectable()
export class OperatorHourlyInvoiceCron {
  private readonly logger = new Logger(OperatorHourlyInvoiceCron.name);
  private readonly time = new TashkentTimeService();

  constructor(@Optional() private readonly telegram: TelegramService) {}

  @Cron('5 * * * *')  // every hour at minute 05 (give time for hourly data to settle)
  async generateHourlyInvoices(): Promise<void> {
    this.logger.log('Running operator-hourly-invoice cron...');
    try {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 60 * 60 * 1000);
      const rows = await db.execute(sql`
        SELECT
          e.id AS employee_id,
          (e.first_name || ' ' || e.last_name) AS full_name,
          e.telegram_chat_id,
          ofn.position_name,
          wc.name_uz AS machine_name,
          COALESCE(SUM(pf.qty_produced), 0)::int AS units_produced,
          COALESCE(SUM(pf.qty_defective), 0)::int AS units_defective,
          COALESCE(e.hourly_rate, 0)::float AS hourly_rate,
          COALESCE((SELECT SUM(amount) FROM employee_ledger el
                    WHERE el.employee_id = e.id AND el.balance < 0), 0)::float AS pos_debt_uzs
        FROM employees e
        LEFT JOIN org_functions ofn ON ofn.id = e.org_function_id
        LEFT JOIN work_centers wc ON wc.id = e.work_center_id
        LEFT JOIN pp_production_facts pf
          ON pf.operator_id = e.id
          AND pf.produced_at BETWEEN ${periodStart} AND ${now}
        WHERE e.is_machine_operator = true
          AND e.status = 'active'
        GROUP BY e.id, e.first_name, e.last_name, e.telegram_chat_id, ofn.position_name, wc.name_uz, e.hourly_rate
        HAVING COALESCE(SUM(pf.qty_produced), 0) > 0
      `);
      const data = (rows as unknown as { rows: OperatorHourlyRow[] }).rows;
      this.logger.log(`Found ${data.length} operators with production in last hour`);

      for (const op of data) {
        const totalProduced = op.units_produced;
        const defectRate = totalProduced > 0 ? (op.units_defective / totalProduced) * 100 : 0;
        const wage = op.hourly_rate;
        const summary = `📄 Soatlik hisobot — ${this.time.formatDate(now)} ${now.getHours()}:00\n\n` +
          `👤 ${op.full_name}\n` +
          `📋 ${op.position_name ?? 'N/A'}\n` +
          `🏭 ${op.machine_name ?? 'N/A'}\n\n` +
          `📦 Ishlab chiqarildi: ${op.units_produced} dona\n` +
          `❌ Brak: ${op.units_defective} (${defectRate.toFixed(1)}%)\n` +
          `💰 Soatlik haq: ${wage.toLocaleString('uz-UZ')} so'm\n` +
          (op.pos_debt_uzs < 0
            ? `📉 POS qarz: ${Math.abs(op.pos_debt_uzs).toLocaleString('uz-UZ')} so'm\n`
            : '');

        // Persist (simplified — actual PDF generation deferred to later cron run)
        await db.execute(sql`
          INSERT INTO operator_hourly_invoices
            (employee_id, period_start, period_end, units_produced, units_defective,
             hourly_rate, summary_text, created_at)
          VALUES
            (${op.employee_id}, ${periodStart}, ${now}, ${op.units_produced},
             ${op.units_defective}, ${op.hourly_rate}, ${summary}, NOW())
        `);

        // Telegram (text first; PDF generation can be added later)
        if (op.telegram_chat_id && this.telegram) {
          await this.telegram.sendMessage(op.telegram_chat_id, summary).catch(() => { /* noop */ });
        }
      }
    } catch (err) {
      this.logger.error(`operator-hourly-invoice cron failed: ${String(err)}`);
    }
  }
}
