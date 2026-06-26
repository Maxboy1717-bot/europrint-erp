import { Injectable, Logger } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { salaryHistory, payrollPeriods, payrollRows } from '@europrint/schemas';
import { sql, eq, and, count, desc, gte, lte } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IHrPayrollRepository, ActiveCardPayInput } from './i-hr-payroll.repo';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleHrPayrollRepository implements IHrPayrollRepository {
  private readonly logger = new Logger(DrizzleHrPayrollRepository.name);

  async findAll(opts: { limit: number; offset: number; userId?: number; changeType?: string; fromDate?: string; toDate?: string }): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const { limit, offset, userId, changeType, fromDate, toDate } = opts;
      const conditions = [];
      if (userId) conditions.push(eq(salaryHistory.userId, userId));
      if (changeType) conditions.push(eq(salaryHistory.changeType, changeType));
      if (fromDate) conditions.push(gte(salaryHistory.effectiveDate, new Date(String(fromDate))));
      if (toDate) conditions.push(lte(salaryHistory.effectiveDate, new Date(String(toDate))));
      const wh = conditions.length > 0 ? and(...conditions) : undefined;
      const [data, countResult] = await Promise.all([
        wh ? db.select().from(salaryHistory).where(wh).orderBy(desc(salaryHistory.createdAt)).limit(limit).offset(offset)
           : db.select().from(salaryHistory).orderBy(desc(salaryHistory.createdAt)).limit(limit).offset(offset),
        wh ? db.select({ count: count() }).from(salaryHistory).where(wh).limit(1).offset(0)
           : db.select({ count: count() }).from(salaryHistory).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Maosh tarixi topilmadi'); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(salaryHistory).values({ ...dto } as typeof salaryHistory.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  // ─── Payroll period closure (T7.4) ──────────────────────────────────────
  async findPeriodById(periodId: number): Promise<Result<Row | null>> {
    try {
      const rows = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, periodId)).limit(1);
      return Ok((Array.isArray(rows) ? (rows[0] ?? null) : null) as Row | null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Davr #${periodId} topilmadi`);
    }
  }

  async listRowsByPeriod(periodId: number): Promise<Result<Row[]>> {
    try {
      const rows = await db.select().from(payrollRows).where(eq(payrollRows.periodId, periodId));
      return Ok((Array.isArray(rows) ? rows : []) as Row[]);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Payroll qatorlari topilmadi: #${periodId}`);
    }
  }

  async markPeriodClosed(periodId: number, _totals: { totalBase: number; totalBonus: number; totalDeductions: number; totalNet: number; rowCount: number }): Promise<Result<Row>> {
    try {
      // payroll_periods canonical schema uses `closed_at` (timestamp) — no `approvalDate` column.
      const rows = await db
        .update(payrollPeriods)
        .set({ status: 'closed', closed_at: new Date() })
        .where(eq(payrollPeriods.id, periodId))
        .returning();
      return Ok(((Array.isArray(rows) ? rows[0] : {}) ?? {}) as Row);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Davr yopishda xatolik: #${periodId}`);
    }
  }

  async markRowsPosted(periodId: number): Promise<Result<{ updated: number }>> {
    try {
      const updated = await db
        .update(payrollRows)
        .set({ status: 'posted' })
        .where(eq(payrollRows.periodId, periodId))
        .returning({ id: payrollRows.id });
      return Ok({ updated: Array.isArray(updated) ? updated.length : 0 });
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Qatorlarni posted qilishda xatolik: #${periodId}`);
    }
  }

  // insertGlJournalLines REMOVED (#10 GL-unify): it wrote debit_account == credit_account (self-
  // canceling) with NULL _id into `entries`. Payroll closure now posts through GlPostingService.postJournal
  // (resolveAccountIds → balanced pair-rows on the _id columns). See payroll.service.closePeriod.

  // ─── Karta-oylik generatsiyasi (Gap #1, T20-A1) ──────────────────────────
  /**
   * Aktiv-kartali har xodim uchun karta-oylik kirishlarini KANONIK zanjirdan o'qiydi:
   *   employees.base_salary (baza) +
   *   employee_org_departments (aktiv, ended_at IS NULL; user_id↔user_id KANONIK, employee_id fallback) +
   *   org_departments.razryad_level_id → razryad_levels.coefficient (razryad-koeff) +
   *   employee_org_departments.stake_fraction (ko'p-karta ulush).
   *
   * `DISTINCT ON (e.id)` + is_primary tartibi: har xodimga BITTA birlamchi karta (1 qator).
   * FABRIKATSIYA YO'Q (Q-40): qiymat o'rnatilmagan bo'lsa NULL qaytadi (soxta default EMAS);
   * chaqiruvchi (PayrollService) NULL ni neytralga (coeff 1.0 / stake 1.0 / base 0) aylantiradi.
   */
  async listActiveCardPayInputs(): Promise<Result<ActiveCardPayInput[]>> {
    try {
      const rows = await runQuery<{
        employee_id: number;
        card_id: number;
        base_salary: string | null;
        razryad_coeff: string | null;
        stake: string | null;
      }>(sql`
        SELECT DISTINCT ON (e.id)
          e.id              AS employee_id,
          eod.org_department_id AS card_id,
          e.base_salary     AS base_salary,
          rl.coefficient    AS razryad_coeff,
          eod.stake_fraction AS stake
        FROM employees e
        JOIN employee_org_departments eod
          ON (eod.user_id = e.user_id OR eod.employee_id = e.id)
         AND eod.is_active = true
         AND eod.ended_at IS NULL
         AND eod.org_department_id IS NOT NULL
        LEFT JOIN org_departments od ON od.id = eod.org_department_id
        LEFT JOIN razryad_levels  rl ON rl.id = od.razryad_level_id
        ORDER BY e.id, eod.is_primary DESC NULLS LAST, eod.id ASC
      `);
      const toNum = (v: string | null): number | null => {
        if (v == null) return null;
        const n = parseFloat(String(v));
        return Number.isFinite(n) ? n : null;
      };
      const list: ActiveCardPayInput[] = (Array.isArray(rows.rows) ? rows.rows : []).map((r) => ({
        employeeId:   Number(r.employee_id),
        cardId:       Number(r.card_id),
        baseSalary:   toNum(r.base_salary),
        razryadCoeff: toNum(r.razryad_coeff),
        stakeShare:   toNum(r.stake),
      }));
      return Ok(list);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Aktiv-kartali xodimlarni o\'qishda xatolik');
    }
  }

  /**
   * Bitta payroll_rows qatorini upsert qiladi (idempotent, ON CONFLICT period_id, employee_id —
   * uq_payroll_rows_period_employee). Qayta-generatsiya dublikat yaratmaydi, mavjudini yangilaydi.
   * net_pay = darvozalangan oylik (PayrollService hisoblaydi). RETURNING xmax=0 → yangi qator.
   */
  async upsertPayrollRow(input: {
    periodId: number;
    employeeId: number;
    baseSalary: number;
    bonus: number;
    deductions: number;
    netPay: number;
    workDays: number | null;
    status: string;
    notes: string | null;
  }): Promise<Result<{ id: number; inserted: boolean }>> {
    try {
      // work_days NOT NULL (default 0) — null kelsa 0 ga COALESCE (jonli constraint, fabrikatsiya emas).
      const workDays = input.workDays == null ? 0 : input.workDays;
      const rows = await runQuery<{ id: number; inserted: boolean }>(sql`
        INSERT INTO payroll_rows
          (period_id, employee_id, base_salary, bonus, deductions, net_pay, total_salary, work_days, status, notes, created_at)
        VALUES
          (${input.periodId}, ${input.employeeId}, ${input.baseSalary}, ${input.bonus}, ${input.deductions},
           ${input.netPay}, ${input.netPay}, ${workDays}, ${input.status}, ${input.notes}, NOW())
        ON CONFLICT (period_id, employee_id) DO UPDATE SET
          base_salary  = EXCLUDED.base_salary,
          bonus        = EXCLUDED.bonus,
          deductions   = EXCLUDED.deductions,
          net_pay      = EXCLUDED.net_pay,
          total_salary = EXCLUDED.total_salary,
          work_days    = EXCLUDED.work_days,
          status       = EXCLUDED.status,
          notes        = EXCLUDED.notes
        RETURNING id, (xmax = 0) AS inserted
      `);
      const r = rows.rows[0];
      return Ok({ id: Number(r?.id ?? 0), inserted: Boolean(r?.inserted) });
    } catch (e: unknown) {
      return Err((e as Error)?.message || `payroll_rows upsert xatolik (emp #${input.employeeId})`);
    }
  }
}
