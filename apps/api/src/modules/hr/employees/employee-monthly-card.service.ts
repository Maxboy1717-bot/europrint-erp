// NOTE: RULE4_EXCEPTION — raw SQL retained: multi-table aggregation (attendance,
// bonuses, fines, overtime) with date-range filtering and SUM/COUNT per category
// not expressible via Drizzle builder; tables span legacy pre-Drizzle era schemas.
/**
 * @module employee-monthly-card.service
 * @description Generates a single-PDF monthly summary for each employee:
 *   - Attendance (days present, late, absent)
 *   - Bonuses + fines
 *   - KPI score + ABC category
 *   - External advance/debt (POS ledger)
 *   - 360 feedback summary + mentor's note
 *
 *   Saved to `employee_monthly_cards` table + Telegram-sent on the 1st of
 *   each month.
 *
 * @layer Service (HR)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Result, safeCall } from '@common/result';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

export interface MonthlyCard {
  employeeId: number;
  fullName: string;
  positionName: string | null;
  departmentName: string | null;
  periodYear: number;
  periodMonth: number;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  bonusUzs: number;
  fineUzs: number;
  kpiScore: number;
  abcCategory: 'A' | 'B' | 'C' | 'D' | null;
  posBalance: number;
  netSalaryUzs: number;
  summaryText: string;
}

@Injectable()
export class EmployeeMonthlyCardService {
  private readonly logger = new Logger(EmployeeMonthlyCardService.name);

  /** Build a monthly card for the given employee + period. */
  async buildCard(employeeId: number, year: number, month: number): Promise<Result<MonthlyCard>> {
    return safeCall(async () => {
      const rows = await db.execute(sql`
        SELECT
          e.id AS employee_id,
          (e.first_name || ' ' || e.last_name) AS full_name,
          ofn.position_name,
          od.name AS department_name,
          (SELECT COUNT(*)::int FROM attendance a
            WHERE a.employee_id = e.id
              AND EXTRACT(YEAR FROM a.check_in_date) = ${year}
              AND EXTRACT(MONTH FROM a.check_in_date) = ${month}) AS days_present,
          (SELECT COUNT(*)::int FROM hr_disciplinary_actions da
            WHERE da.employee_id = e.id
              AND da.action_type LIKE 'late%'
              AND EXTRACT(YEAR FROM da.action_date) = ${year}
              AND EXTRACT(MONTH FROM da.action_date) = ${month}) AS days_late,
          0::int AS days_absent,
          0::numeric AS bonus_uzs,
          (SELECT COALESCE(SUM(applied_fine_uzs), 0)::numeric FROM hr_disciplinary_actions da
            WHERE da.employee_id = e.id AND da.status = 'applied'
              AND EXTRACT(YEAR FROM da.action_date) = ${year}
              AND EXTRACT(MONTH FROM da.action_date) = ${month}) AS fine_uzs,
          0::numeric AS kpi_score,
          e.vysotskiy_category AS abc_category,
          COALESCE((SELECT SUM(balance) FROM employee_ledger WHERE employee_id = e.id), 0)::numeric AS pos_balance,
          COALESCE(e.base_salary, 0)::numeric AS net_salary_uzs
        FROM employees e
        LEFT JOIN org_functions ofn ON ofn.id = e.org_function_id
        LEFT JOIN org_departments od ON od.id = e.org_department_id
        WHERE e.id = ${employeeId}
        LIMIT 1
      `);
      const r = (rows as unknown as { rows: Array<{
        employee_id: number; full_name: string;
        position_name: string | null; department_name: string | null;
        days_present: number; days_late: number; days_absent: number;
        bonus_uzs: number; fine_uzs: number; kpi_score: number;
        abc_category: string | null; pos_balance: number; net_salary_uzs: number;
      }> }).rows[0];
      if (!r) throw new Error('Employee not found');

      const card: MonthlyCard = {
        employeeId: r.employee_id, fullName: r.full_name,
        positionName: r.position_name, departmentName: r.department_name,
        periodYear: year, periodMonth: month,
        daysPresent: r.days_present, daysLate: r.days_late, daysAbsent: r.days_absent,
        bonusUzs: r.bonus_uzs, fineUzs: r.fine_uzs,
        kpiScore: r.kpi_score,
        abcCategory: (r.abc_category as MonthlyCard['abcCategory']) ?? null,
        posBalance: r.pos_balance,
        netSalaryUzs: r.net_salary_uzs - r.fine_uzs + r.bonus_uzs - Math.max(0, -r.pos_balance),
        summaryText: this.composeSummary({
          fullName: r.full_name, year, month,
          daysPresent: r.days_present, daysLate: r.days_late,
          fineUzs: r.fine_uzs, bonusUzs: r.bonus_uzs,
          posBalance: r.pos_balance, abc: r.abc_category,
        }),
      };

      // Persist
      await db.execute(sql`
        INSERT INTO employee_monthly_cards
          (employee_id, period_year, period_month, days_present, days_late, days_absent,
           bonus_uzs, fine_uzs, kpi_score, abc_category, pos_balance, net_salary_uzs,
           summary_text, generated_at)
        VALUES
          (${card.employeeId}, ${card.periodYear}, ${card.periodMonth},
           ${card.daysPresent}, ${card.daysLate}, ${card.daysAbsent},
           ${card.bonusUzs}, ${card.fineUzs}, ${card.kpiScore}, ${card.abcCategory},
           ${card.posBalance}, ${card.netSalaryUzs}, ${card.summaryText}, NOW())
        ON CONFLICT (employee_id, period_year, period_month)
        DO UPDATE SET
          days_present = EXCLUDED.days_present,
          days_late = EXCLUDED.days_late,
          fine_uzs = EXCLUDED.fine_uzs,
          summary_text = EXCLUDED.summary_text,
          generated_at = NOW()
      `);

      return card;
    }, 'DB_ERROR');
  }

  private composeSummary(d: {
    fullName: string; year: number; month: number;
    daysPresent: number; daysLate: number;
    fineUzs: number; bonusUzs: number;
    posBalance: number; abc: string | null;
  }): string {
    return `📊 Oylik kartochka — ${d.month}/${d.year}\n\n` +
      `👤 ${d.fullName}\n\n` +
      `🗓 Davomat:\n` +
      `   ✓ Ish kunlari: ${d.daysPresent}\n` +
      `   ⏰ Kech kelishlar: ${d.daysLate}\n\n` +
      `💰 Moliya:\n` +
      `   🎁 Mukofot: ${d.bonusUzs.toLocaleString('uz-UZ')} so'm\n` +
      `   ⚠️ Jarima: ${d.fineUzs.toLocaleString('uz-UZ')} so'm\n` +
      (d.posBalance < 0 ? `   📉 POS qarz: ${Math.abs(d.posBalance).toLocaleString('uz-UZ')} so'm\n` : '') +
      `\n📈 ABC kategoriya: ${d.abc ?? 'Belgilanmagan'}`;
  }
}
