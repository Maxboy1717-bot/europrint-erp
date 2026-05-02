import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql, eq, isNotNull, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { salary_history } from '@shared/db/schema-business-c-2';
import { payroll_advances } from '@shared/db/schema-business-b-1';
import { hrEmployees } from '@shared/db/schema-misc-app-a';
import { customer_payments } from '@shared/db/schema-compat-5';

type Row = Record<string, unknown>;

@Injectable()
export class FinanceActionsRepository {
  async getSalaryBenchmark(): Promise<Result<Row>> {
    try {
      const rows = await db.select({
        market_min:    sql<number>`MIN(${salary_history.base_salary}::numeric)`,
        market_median: sql<number>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${salary_history.base_salary}::numeric)`,
        market_max:    sql<number>`MAX(${salary_history.base_salary}::numeric)`,
        market_avg:    sql<number>`AVG(${salary_history.base_salary}::numeric)`,
        sample_size:   sql<number>`COUNT(*)`,
      }).from(salary_history).where(isNotNull(salary_history.base_salary));
      return Ok((rows[0] ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async approvePayment(id: number, approvedBy: number | string): Promise<Result<Row>> {
    try {
      const now = _time.now();
      await db.update(customer_payments)
        .set({
          status: 'approved',
          approved_by: String(approvedBy),
          approved_at: now,
          applied_at: now,
        })
        .where(eq(customer_payments.id, id));
      return Ok({ id, status: 'approved', approved_by: approvedBy, approved_at: now.toISOString() } as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async listAdvances(lim: number, off: number, page: number): Promise<Result<{ items: Row[]; total: number; page: number; limit: number }>> {
    try {
      const [items, countRows] = await Promise.all([
        db.select({
          id:            payroll_advances.id,
          employee_id:   payroll_advances.employee_id,
          amount:        payroll_advances.amount,
          request_date:  payroll_advances.request_date,
          status:        payroll_advances.status,
          document_id:   payroll_advances.document_id,
          approved_at:   payroll_advances.approved_at,
          created_at:    payroll_advances.created_at,
          employee_name: sql<string>`TRIM(COALESCE(${hrEmployees.first_name}, '') || ' ' || COALESCE(${hrEmployees.last_name}, ''))`,
        }).from(payroll_advances)
          .leftJoin(hrEmployees, eq(hrEmployees.id, payroll_advances.employee_id))
          .orderBy(desc(payroll_advances.created_at))
          .limit(lim).offset(off),
        db.select({ total: sql<number>`COUNT(*)::int` }).from(payroll_advances),
      ]);
      const total = Number(countRows[0]?.total ?? 0);
      return Ok({ items: items as Row[], total, page, limit: lim });
    } catch (e) {
      return Err(String(e));
    }
  }

  async getPendingAdvances(): Promise<Result<Row[]>> {
    try {
      const rows = await db.select({
        id:            payroll_advances.id,
        employee_id:   payroll_advances.employee_id,
        amount:        payroll_advances.amount,
        request_date:  payroll_advances.request_date,
        status:        payroll_advances.status,
        document_id:   payroll_advances.document_id,
        approved_at:   payroll_advances.approved_at,
        created_at:    payroll_advances.created_at,
        employee_name: sql<string>`TRIM(COALESCE(${hrEmployees.first_name}, '') || ' ' || COALESCE(${hrEmployees.last_name}, ''))`,
      }).from(payroll_advances)
        .leftJoin(hrEmployees, eq(hrEmployees.id, payroll_advances.employee_id))
        .where(eq(payroll_advances.status, 'pending'))
        .orderBy(desc(payroll_advances.created_at))
        .limit(100);
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }
}
