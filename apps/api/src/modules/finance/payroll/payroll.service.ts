/**
 * @module payroll.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject } from '@nestjs/common';
import { IFinancePayrollRepository, FINANCE_PAYROLL_REPO } from './i-finance-payroll.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class PayrollService {

  constructor(@Inject(FINANCE_PAYROLL_REPO) private readonly financePayrollRepo: IFinancePayrollRepository) {}

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

  async close(id: number){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.financePayrollRepo.updateStatus(id, 'closed');
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

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
