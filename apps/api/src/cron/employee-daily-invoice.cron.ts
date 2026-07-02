/**
 * @module employee-daily-invoice.cron
 * @description Vizyon A4 (OMBOR-KASSIR-INTERVYU-2026-06-08 §17): "Har xodim kunlik
 *   ishlagan pulini har kuni PDF qabul qiladi".
 *     - Uskunachi (bugungi `production_fact` yozuvi bor xodim) = REAL ishlab chiqarish
 *       natijasi bo'yicha (financial-reports-query.helpers.ts bilan BIR XIL manba jadval).
 *     - Boshqa xodim (ofis/farrosh/dizayner) = base_salary / oy-ish-kunlari (kunlik ulush).
 *     - Ikkalasi ham yo'q xodim → PDF YARATILMAYDI (skip + log — fabrikatsiya taqiq).
 *   PDF `operator_hourly_invoices.pdf_data` (BYTEA) ga saqlanadi, xodimga `notifications`
 *   (ERP, is_read = qabul-belgisi) + ixtiyoriy Telegram orqali yuboriladi.
 *
 *   Tarix (Q-46): avvalgi soatlik variant DBda MAVJUD BO'LMAGAN `pp_production_facts` va
 *   `employee_ledger` jadvallariga so'rov yuborar edi (chaqirilsa crash) va hech qaysi
 *   modulda provider emas edi (o'lik kod) — kunlik + real manba + modulga ulangan holda
 *   TO'LIQ qayta qurildi. POS-qarz manbasi (`employee_ledger`) DBda yo'q → PDFda qarz
 *   satri chizilmaydi (0 uzatiladi) — jadval paydo bo'lganda ulanadi, fabrikatsiya yo'q.
 *
 * NOTE: Raw SQL — set-based o'tish (employees + production_fact agregat JOIN, N+1 yo'q)
 *   va BYTEA / notifications INSERT'lar. ARCHITECTURE_RULES.md Rule 4.
 * @layer Cron (HR / Finance)
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TashkentTimeService } from '@common/time';
import { TelegramService } from '../telegram/telegram.service';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { HrPdfGeneratorService } from '../common/pdf/hr-pdf-generator.service';

/**
 * Oy ish-kunlari default — mavjud kod-precedent bilan bir xil qiymat
 * (finance-extended-payroll.service.ts DEFAULT_WORK_DAYS = 22). Sozlanadigan
 * master-data qiymatini egasi belgilaganda shu yerdan o'qiladi.
 */
const DEFAULT_WORK_DAYS_PER_MONTH = 22;

interface EmployeeDailyRow {
  employee_id: number;
  user_id: number | null;
  full_name: string;
  telegram_chat_id: string | null;
  position_name: string | null;
  machine_name: string | null;
  hourly_rate: number;
  base_salary: number;
  units_produced: number;
  units_defective: number;
  has_production: boolean;
}

@Injectable()
export class EmployeeDailyInvoiceCron {
  private readonly logger = new Logger(EmployeeDailyInvoiceCron.name);
  private readonly time = new TashkentTimeService();

  constructor(
    private readonly pdfSvc: HrPdfGeneratorService,
    @Optional() private readonly telegram?: TelegramService,
  ) {}

  // Vizyon A4 — KUNLIK (soatlik emas): har kun 19:00 Toshkent, kassir Z-reportidan (20:00) oldin.
  @Cron('0 19 * * *', { timeZone: 'Asia/Tashkent' })
  async generateDailyInvoices(): Promise<void> {
    const now = this.time.now();
    const dayStart = this.time.today();
    const todayStr = this.time.formatDate(now); // production_fact.fact_date varchar 'YYYY-MM-DD'

    try {
      // Idempotency: bugun allaqachon invoice olgan xodimlar (cron qayta ishga tushsa dublikat yo'q).
      const doneRes = await runQuery<{ employee_id: number }>(sql`
        SELECT employee_id FROM operator_hourly_invoices WHERE period_start >= ${dayStart}
      `);
      const alreadyDone = new Set(
        (Array.isArray(doneRes.rows) ? doneRes.rows : []).map((r) => Number(r.employee_id)),
      );

      // Bitta set-based so'rov: faol xodimlar + bugungi ishlab-chiqarish agregati.
      // production_fact.operator_id = users.id (jonli isbot: operator_id=46 ↔ employees.user_id=46),
      // shuning uchun JOIN e.user_id orqali.
      const rowsRes = await runQuery<EmployeeDailyRow>(sql`
        SELECT
          e.id AS employee_id,
          e.user_id,
          (e.first_name || ' ' || e.last_name) AS full_name,
          e.telegram_chat_id,
          ofn.position_name,
          wc.name_uz AS machine_name,
          COALESCE(e.hourly_rate, 0)::float AS hourly_rate,
          COALESCE(e.base_salary, 0)::float AS base_salary,
          COALESCE(pf.units_produced, 0)::int AS units_produced,
          COALESCE(pf.units_defective, 0)::int AS units_defective,
          (pf.operator_id IS NOT NULL) AS has_production
        FROM employees e
        LEFT JOIN org_functions ofn ON ofn.id = e.org_function_id
        LEFT JOIN work_centers wc ON wc.id = e.work_center_id
        LEFT JOIN (
          SELECT operator_id,
                 SUM(fact_quantity)  AS units_produced,
                 SUM(scrap_quantity) AS units_defective
            FROM production_fact
           WHERE fact_date = ${todayStr} AND operator_id IS NOT NULL
           GROUP BY operator_id
        ) pf ON pf.operator_id = e.user_id
        WHERE e.status = 'active' AND e.deleted_at IS NULL
      `);
      const employees = Array.isArray(rowsRes.rows) ? rowsRes.rows : [];

      let created = 0;
      let skippedNoData = 0;
      let failed = 0;
      for (const emp of employees) {
        if (alreadyDone.has(emp.employee_id)) continue;
        try {
          const outcome = await this.buildAndSend(emp, dayStart, now, todayStr);
          if (outcome === 'created') created++;
          else skippedNoData++;
        } catch (e) {
          this.logger.warn(`Kunlik invoice xato (xodim #${emp.employee_id}): ${String(e)}`);
          failed++;
        }
      }
      this.logger.log(
        `Kunlik ishlagan-pul cron (${todayStr}): ${created} PDF, ${skippedNoData} skip (data yo'q), ${failed} xato`,
      );
    } catch (err) {
      this.logger.error(`employee-daily-invoice cron failed: ${String(err)}`);
    }
  }

  /** Bitta xodim: PDF (uskunachi=real data / boshqa=kunlik-ulush) + saqlash + notification. */
  private async buildAndSend(
    emp: EmployeeDailyRow,
    dayStart: Date,
    now: Date,
    todayStr: string,
  ): Promise<'created' | 'skipped'> {
    let pdfBuf: Buffer;
    let summary: string;

    if (emp.has_production) {
      // Uskunachi — REAL ishlab chiqarish natijasi (production_fact).
      pdfBuf = await this.pdfSvc.generateOperatorInvoice({
        fullName: emp.full_name,
        positionName: emp.position_name,
        machineName: emp.machine_name,
        periodStart: dayStart,
        periodEnd: now,
        unitsProduced: emp.units_produced,
        unitsDefective: emp.units_defective,
        hourlyRate: emp.hourly_rate,
        posDebtUzs: 0, // employee_ledger jadvali DBda yo'q — qarz satri chizilmaydi (fabrikatsiya taqiq)
      });
      const defectRate = emp.units_produced > 0 ? (emp.units_defective / emp.units_produced) * 100 : 0;
      summary =
        `Kunlik ishlagan-pul hisoboti (${todayStr}) — uskunachi.\n` +
        `Ishlab chiqarildi: ${emp.units_produced} dona, brak: ${emp.units_defective} (${defectRate.toFixed(1)}%).\n` +
        `Soatlik tarif: ${emp.hourly_rate.toLocaleString('en-US')} UZS.`;
    } else if (emp.base_salary > 0) {
      // Boshqa xodim — kunlik ulush = oylik / oy-ish-kunlari (vizyon A4 formulasi).
      const dailyEarned = emp.base_salary / DEFAULT_WORK_DAYS_PER_MONTH;
      pdfBuf = await this.pdfSvc.generateDailyEarnings({
        fullName: emp.full_name,
        positionName: emp.position_name,
        date: now,
        baseSalaryUzs: emp.base_salary,
        workDaysPerMonth: DEFAULT_WORK_DAYS_PER_MONTH,
        dailyEarnedUzs: dailyEarned,
      });
      summary =
        `Kunlik ishlagan-pul hisoboti (${todayStr}).\n` +
        `Kunlik ulush: ${Math.round(dailyEarned).toLocaleString('en-US')} UZS ` +
        `(oylik ${emp.base_salary.toLocaleString('en-US')} UZS / ${DEFAULT_WORK_DAYS_PER_MONTH} ish kuni).`;
    } else {
      // Na ishlab-chiqarish datasi, na base_salary — PDF yaratilmaydi (fabrikatsiya taqiq).
      this.logger.debug(
        `Xodim #${emp.employee_id} (${emp.full_name}): data yo'q (production=0, base_salary=0) — skip`,
      );
      return 'skipped';
    }

    // PDF saqlash — operator_hourly_invoices.pdf_data (BYTEA, mavjud jadval).
    const inserted = await runQuery<{ id: number }>(sql`
      INSERT INTO operator_hourly_invoices
        (employee_id, period_start, period_end, units_produced, units_defective,
         hourly_rate, summary_text, pdf_data, created_at)
      VALUES
        (${emp.employee_id}, ${dayStart}, ${now}, ${emp.units_produced},
         ${emp.units_defective}, ${emp.hourly_rate}, ${summary}, ${pdfBuf}, NOW())
      RETURNING id
    `);
    const invoiceId = Array.isArray(inserted.rows) ? inserted.rows[0]?.id ?? null : null;

    // ERP notification (mavjud notifications jadvali; is_read = xodim qabul-belgisi).
    if (emp.user_id) {
      const title = `💵 Kunlik ishlagan pul — ${todayStr}`;
      await runQuery(sql`
        INSERT INTO notifications
          (user_id, type, title, body, is_read, priority, title_uz, message_uz,
           reference_id, reference_type, created_at)
        VALUES
          (${emp.user_id}, 'employee_daily_invoice', ${title}, ${summary}, FALSE, 'normal',
           ${title}, ${summary}, ${invoiceId}, 'operator_hourly_invoice', NOW())
      `);
    } else {
      this.logger.debug(`Xodim #${emp.employee_id}: user_id yo'q — ERP notification o'tkazildi (PDF saqlangan)`);
    }

    // Telegram (best-effort, ixtiyoriy kanal).
    if (emp.telegram_chat_id && this.telegram) {
      await this.telegram.sendMessage(emp.telegram_chat_id, `📄 ${summary}`).catch(() => { /* noop */ });
    }
    return 'created';
  }
}
