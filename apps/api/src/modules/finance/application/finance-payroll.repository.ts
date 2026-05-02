import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

const TAX_CONSTANTS = { INPS_RATE: 0.12, JSHD_RATE: 0.12 };
type Row = Record<string, unknown>;

@Injectable()
export class FinancePayrollRepository {
  async byDepartment(periodId?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT u.department_id, d.name AS department_name,
               COUNT(*) AS employee_count,
               COALESCE(SUM(pr.base_salary),0) AS total_base_salary,
               COALESCE(SUM(pr.bonuses),0) AS total_bonuses,
               COALESCE(SUM(pr.deductions),0) AS total_deductions,
               COALESCE(SUM(pr.total_salary),0) AS total_salary
        FROM payroll_rows pr
        INNER JOIN users u ON u.id = pr.employee_id
        LEFT JOIN departments d ON d.id = u.department_id
        WHERE (${periodId ?? null}::text IS NULL OR pr.period_id = ${periodId ?? null})
        GROUP BY u.department_id, d.name
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async byBrigade(periodId?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT u.shift,
               COUNT(*) AS employee_count,
               COALESCE(SUM(pr.base_salary),0) AS total_base_salary,
               COALESCE(SUM(pr.bonuses),0) AS total_bonuses,
               COALESCE(SUM(pr.deductions),0) AS total_deductions,
               COALESCE(SUM(pr.total_salary),0) AS total_salary
        FROM payroll_rows pr
        INNER JOIN users u ON u.id = pr.employee_id
        WHERE (${periodId ?? null}::text IS NULL OR pr.period_id = ${periodId ?? null})
        GROUP BY u.shift
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async taxSummary(periodId?: string): Promise<Result<{ grossSalary: number; inpsTotal: number; jshdTotal: number; totalDeductions: number; netSalary: number; employeeCount: number }>> {
    return safeCall(async () => {
      const rows = await runQuery<{ employee_count: string; total_gross_salary: string; total_net_salary: string }>(sql`
        SELECT COUNT(*) AS employee_count,
               COALESCE(SUM(base_salary + bonuses),0) AS total_gross_salary,
               COALESCE(SUM(total_salary),0) AS total_net_salary
        FROM payroll_rows
        WHERE (${periodId ?? null}::text IS NULL OR period_id = ${periodId ?? null})
      `);
      const row = rows.rows[0] ?? {};
      const grossSalary = Number(row.total_gross_salary) || 0;
      const inpsTotal = Math.round(grossSalary * TAX_CONSTANTS.INPS_RATE);
      const taxableIncome = grossSalary - inpsTotal;
      const jshdTotal = Math.round(taxableIncome * TAX_CONSTANTS.JSHD_RATE);
      return { grossSalary, inpsTotal, jshdTotal, totalDeductions: inpsTotal + jshdTotal, netSalary: Number(row.total_net_salary) || 0, employeeCount: Number(row.employee_count) || 0 };
      }, 'DB_ERROR');
  }
}
