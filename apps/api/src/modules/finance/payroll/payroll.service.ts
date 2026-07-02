/**
 * @module payroll.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { IFinancePayrollRepository, FINANCE_PAYROLL_REPO } from './i-finance-payroll.repo';
import { safeCall, Result, AppError } from '@common/result';
// Moliya-GL-Kassa (2026-07-02, APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02): HR's
// PayrollService.closePeriod is the ONE real payroll-closure implementation (validates
// dates/rows, builds+posts the balanced GL journal via GlPostingService, marks the period
// closed only after the GL succeeds, emits payroll.period.closed + per-record events).
// Finance's own close() used to just flip payroll_periods.status='closed' with no
// validation/GL/event — a second, unguarded door onto the SAME payroll_periods /
// payroll_rows tables. It now proxies to HR's closePeriod() instead of duplicating it.
import { PayrollService as HrPayrollService } from '../../hr/payroll/payroll.service';

@Injectable()
export class PayrollService {

  constructor(
    @Inject(FINANCE_PAYROLL_REPO) private readonly financePayrollRepo: IFinancePayrollRepository,
    @Inject(forwardRef(() => HrPayrollService)) private readonly hrPayrollService: HrPayrollService,
  ) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.financePayrollRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findOne(id: number) {
    const result = await this.financePayrollRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Oylik davri #${id} topilmadi`);
    const rowsResult = await this.financePayrollRepo.findRowsByPeriodId(id);
    if (!rowsResult.ok) throw new InternalServerErrorException(rowsResult.error);
    return { ...result.data, rows: rowsResult.data };
  }

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.financePayrollRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  /**
   * Proxy to HR's `PayrollService.closePeriod` — the ONE real payroll-closure path
   * (row aggregation + GL journal posting + ЦКП/LMS gate side-effects + domain event).
   * Finance no longer flips `payroll_periods.status` directly (Moliya-GL-Kassa fix,
   * 2026-07-02) — that left the GL unposted and skipped every closure invariant.
   */
  async close(id: number): Promise<Result<unknown, AppError>> {
    return this.hrPayrollService.closePeriod(id);
  }

  async calculatePeriod(id: number){
    return safeCall(async () => {
    const period = await this.findOne(id);
    const rows = (period.rows as Record<string, unknown>[]) ?? [];

    const calculated = (Array.isArray(rows) ? rows : []).map((row) => {
      // ERP gross-only: income-tax/pension are computed in 1C, not here. This
      // period carries no non-tax deductions, so net = gross.
      const gross = Number(row.grossSalary ?? row.baseSalary ?? 0);
      const net = gross;
      return { ...row, netSalary: net, calculated: true };
    });

    const statusResult = await this.financePayrollRepo.updateStatus(id, 'calculated');
    if (!statusResult.ok) throw new InternalServerErrorException(statusResult.error);

    return {
      periodId: id,
      status: 'calculated',
      employeeCount: calculated.length,
      totalGross: parseFloat((calculated as Record<string, unknown>[]).reduce((s, r) => s + Number(r.grossSalary ?? r.baseSalary ?? 0), 0).toFixed(2)),
      totalNet: parseFloat((calculated as Record<string, unknown>[]).reduce((s, r) => s + Number(r.netSalary ?? 0), 0).toFixed(2)),
      rows: calculated,
    };
  
    });}
}
