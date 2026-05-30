/**
 * @module finance-extended-payroll.service
 * @description Real DB-backed payroll list/calculate/approve for the
 * `/finance-extended/payroll*` endpoints. Replaces the former HTTP 501 stubs
 * (#FX-1). The calculate math mirrors the FE preview in CalculatePayrollDialog
 * exactly, so the persisted row matches what the user saw before saving.
 * Reads/writes the canonical payroll_* tables via @workspace/db.
 * @layer Application (Finance Extended)
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { payrollContracts, payrollCalculations, users } from '@workspace/db';
import { and, eq, desc } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';

// ERP is gross-only: tax (INPS/JSHD) and the statutory min-wage guarantee are
// computed in 1C, NOT here. This service handles gross + NON-TAX deductions only.
const DEFAULT_WORK_DAYS = 22;
const DEFAULT_MONTHLY_HOURS = 176;
const LIST_LIMIT = 200;

export interface PayrollCalculateInput {
  employeeId: string | number;
  workDays?: number;
  workHours?: number;
  productionUnits?: number;
  bonuses?: number;
  allowances?: number;
  advances?: number;
  loans?: number;
  otherDeductions?: number;
}

export interface PayrollAiCalculateInput {
  employeeId: string | number;
  periodMonth?: string;
}

type ContractRow = typeof payrollContracts.$inferSelect;
type CalcRow = typeof payrollCalculations.$inferSelect;

interface ComputeInput {
  workHours: number;
  productionUnits: number;
  bonuses: number;
  allowances: number;
  advances: number;
  loans: number;
  otherDeductions: number;
}

interface ComputeParts {
  basePay: number;
  hourlyPay: number;
  pieceworkPay: number;
  grossPay: number;
  advances: number;
  loans: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
}

interface AiRecommendation {
  type: 'bonus' | 'penalty' | 'adjustment' | 'warning' | 'optimization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  suggestedAmount?: number;
}

@Injectable()
export class FinanceExtendedPayrollService {
  /** Earnings/deductions engine — byte-for-byte parity with FE calculatePreview. */
  private compute(contract: ContractRow, i: ComputeInput): ComputeParts {
    let basePay = 0;
    let hourlyPay = 0;
    let pieceworkPay = 0;
    switch (contract.payType) {
      case 'fixed': basePay = contract.baseSalary ?? 0; break;
      case 'hourly': hourlyPay = i.workHours * (contract.hourlyRate ?? 0); break;
      case 'piecework': pieceworkPay = i.productionUnits * (contract.pieceworkRate ?? 0); break;
    }
    const grossPay = basePay + hourlyPay + pieceworkPay + i.bonuses + i.allowances;
    // ERP gross-only: deductions are NON-TAX (advances/loans/other). Tax + min-wage in 1C.
    const totalDeductions = i.advances + i.loans + i.otherDeductions;
    const netPay = grossPay - totalDeductions;
    return {
      basePay, hourlyPay, pieceworkPay, grossPay,
      advances: i.advances, loans: i.loans, otherDeductions: i.otherDeductions,
      totalDeductions, netPay,
    };
  }

  private async findActiveContract(employeeId: number): Promise<ContractRow | null> {
    const rows = await db.select().from(payrollContracts)
      .where(and(eq(payrollContracts.employeeId, employeeId), eq(payrollContracts.status, 'active')))
      .orderBy(desc(payrollContracts.id)).limit(1);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  private mapContract(r: ContractRow) {
    return { ...r, id: String(r.id), employeeId: String(r.employeeId) };
  }

  private mapCalc(r: CalcRow) {
    return { ...r, id: String(r.id), employeeId: String(r.employeeId) };
  }

  async listContracts(): Promise<Result<unknown[]>> {
    try {
      const rows = await db.select().from(payrollContracts)
        .orderBy(desc(payrollContracts.id)).limit(LIST_LIMIT);
      return Ok((Array.isArray(rows) ? rows : []).map((r) => this.mapContract(r)));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `PAYROLL_CONTRACTS_LIST_FAILED: ${String(e)}`));
    }
  }

  async listCalculations(): Promise<Result<unknown[]>> {
    try {
      const rows = await db.select().from(payrollCalculations)
        .orderBy(desc(payrollCalculations.createdAt)).limit(LIST_LIMIT);
      return Ok((Array.isArray(rows) ? rows : []).map((r) => this.mapCalc(r)));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `PAYROLL_CALCS_LIST_FAILED: ${String(e)}`));
    }
  }

  private async insertCalc(
    contract: ContractRow,
    employeeId: number,
    workDays: number,
    workHours: number,
    productionUnits: number,
    bonuses: number,
    allowances: number,
    p: ComputeParts,
    notes?: string | null,
  ): Promise<CalcRow> {
    const values: typeof payrollCalculations.$inferInsert = {
      periodId: null,
      employeeId,
      contractId: String(contract.id),
      payType: contract.payType,
      workDays,
      workHours,
      overtimeHours: 0,
      productionUnits,
      basePay: p.basePay,
      hourlyPay: p.hourlyPay,
      pieceworkPay: p.pieceworkPay,
      overtimePay: 0,
      bonuses,
      allowances,
      grossPay: p.grossPay,
      // tax columns (tax_inps/tax_jshd/total_taxes) + min_wage_top_up left at DB default 0:
      // ERP is gross-only, tax & min-wage live in 1C (schema columns kept, not written).
      otherDeductions: p.otherDeductions,
      advances: p.advances,
      loans: p.loans,
      totalDeductions: p.totalDeductions,
      netPay: p.netPay,
      status: 'calculated',
      calculatedAt: new Date(),
      notes: notes ?? null,
    };
    const rows = await db.insert(payrollCalculations).values(values).returning();
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('insert returned no rows');
    }
    return rows[0];
  }

  async calculate(dto: PayrollCalculateInput): Promise<Result<unknown>> {
    const employeeId = Number(dto.employeeId);
    if (!Number.isFinite(employeeId)) {
      return Err(AppErr('VALIDATION', 'employeeId must be numeric'));
    }
    try {
      const contract = await this.findActiveContract(employeeId);
      if (!contract) {
        return Err(AppErr('NOT_FOUND', `No active payroll contract for employee ${employeeId}`));
      }
      const parts = this.compute(contract, {
        workHours: dto.workHours ?? 0,
        productionUnits: dto.productionUnits ?? 0,
        bonuses: dto.bonuses ?? 0,
        allowances: dto.allowances ?? 0,
        advances: dto.advances ?? 0,
        loans: dto.loans ?? 0,
        otherDeductions: dto.otherDeductions ?? 0,
      });
      const inserted = await this.insertCalc(
        contract, employeeId, dto.workDays ?? 0, dto.workHours ?? 0,
        dto.productionUnits ?? 0, dto.bonuses ?? 0, dto.allowances ?? 0, parts,
      );
      return Ok(this.mapCalc(inserted));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `PAYROLL_CALCULATE_FAILED: ${String(e)}`));
    }
  }

  async aiCalculate(dto: PayrollAiCalculateInput): Promise<Result<unknown>> {
    const employeeId = Number(dto.employeeId);
    if (!Number.isFinite(employeeId)) {
      return Err(AppErr('VALIDATION', 'employeeId must be numeric'));
    }
    try {
      const contract = await this.findActiveContract(employeeId);
      if (!contract) {
        return Err(AppErr('NOT_FOUND', `No active payroll contract for employee ${employeeId}`));
      }
      const monthlyHours = contract.monthlyHours ?? DEFAULT_MONTHLY_HOURS;
      const workHours = contract.payType === 'hourly' ? monthlyHours : 0;
      const parts = this.compute(contract, {
        workHours,
        productionUnits: 0,
        bonuses: 0, allowances: 0, advances: 0, loans: 0, otherDeductions: 0,
      });
      await this.insertCalc(contract, employeeId, DEFAULT_WORK_DAYS, workHours, 0, 0, 0, parts);
      const employeeName = await this.resolveEmployeeName(employeeId);
      const periodMonth = dto.periodMonth ?? new Date().toISOString().slice(0, 7);
      return Ok(this.buildAiResult(contract, employeeId, employeeName, periodMonth, workHours, parts));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `PAYROLL_AI_CALCULATE_FAILED: ${String(e)}`));
    }
  }

  private async resolveEmployeeName(employeeId: number): Promise<string> {
    try {
      const rows = await db
        .select({ fullName: users.fullName, firstName: users.firstName, lastName: users.lastName })
        .from(users).where(eq(users.id, employeeId)).limit(1);
      const u = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      if (!u) return `#${employeeId}`;
      const full = (u.fullName ?? '').trim();
      if (full) return full;
      const joined = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
      return joined || `#${employeeId}`;
    } catch {
      return `#${employeeId}`;
    }
  }

  private buildAiResult(
    contract: ContractRow,
    employeeId: number,
    employeeName: string,
    periodMonth: string,
    workHours: number,
    p: ComputeParts,
  ) {
    const recommendations: AiRecommendation[] = [];
    if (contract.payType === 'piecework') {
      recommendations.push({
        type: 'optimization', priority: 'medium',
        title: "Ishbay ma'lumotlarini kiriting",
        description: "AI hisoblashda ishlab chiqarish birliklari kiritilmagan — natijani aniqlashtirish uchun ularni qo'shing.",
        confidence: 60,
      });
    }
    const dataQuality = contract.payType === 'fixed' ? 'high' : 'medium';
    const confidence = contract.payType === 'fixed' ? 85 : 65;
    return {
      employeeId: String(employeeId),
      employeeName,
      periodMonth,
      payType: contract.payType,
      workDays: DEFAULT_WORK_DAYS,
      workHours,
      overtimeHours: 0,
      productionUnits: 0,
      basePay: p.basePay,
      hourlyPay: p.hourlyPay,
      pieceworkPay: p.pieceworkPay,
      overtimePay: 0,
      grossPay: p.grossPay,
      totalDeductions: p.totalDeductions,
      netPay: p.netPay,
      confidence,
      dataQuality,
      recommendations,
      evidence: {
        attendanceWorkDays: DEFAULT_WORK_DAYS,
        attendanceWorkHours: workHours,
        attendanceConfidence: 50,
        productionUnits: 0,
        productionConfidence: 0,
        trackedHours: 0,
        taskCompletionCount: 0,
        timeTrackingConfidence: 0,
        overtimeHours: 0,
        overallConfidence: confidence,
        dataQualityScore: dataQuality,
        anomaliesDetected: false,
        anomalyDetails: [],
      },
    };
  }

  async approveCalculation(id: string | number, approvedBy?: string | number): Promise<Result<unknown>> {
    const calcId = Number(id);
    if (!Number.isFinite(calcId)) {
      return Err(AppErr('VALIDATION', 'calculation id must be numeric'));
    }
    const approvedByNum = Number(approvedBy);
    const finalApprovedBy = Number.isFinite(approvedByNum) ? approvedByNum : null;
    try {
      const rows = await db.update(payrollCalculations)
        .set({ status: 'approved', approvedAt: new Date(), approvedBy: finalApprovedBy })
        .where(eq(payrollCalculations.id, calcId)).returning();
      const updated = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      if (!updated) {
        return Err(AppErr('NOT_FOUND', `Payroll calculation ${calcId} not found`));
      }
      return Ok(this.mapCalc(updated));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `PAYROLL_APPROVE_FAILED: ${String(e)}`));
    }
  }

  /**
   * Batch-calculates payroll for every active contract for the given period.
   * Idempotent: employees already calculated for this period (notes === period)
   * are skipped so re-running doesn't create duplicate rows. Inputs default to
   * the contract terms (fixed → base; hourly → monthly hours; piecework → 0).
   */
  async runPayroll(period: string): Promise<Result<unknown>> {
    if (!period || typeof period !== 'string') {
      return Err(AppErr('VALIDATION', 'period is required (YYYY-MM)'));
    }
    try {
      const contractRows = await db.select().from(payrollContracts)
        .where(eq(payrollContracts.status, 'active')).limit(LIST_LIMIT);
      const activeContracts = Array.isArray(contractRows) ? contractRows : [];

      const existing = await db.select({ employeeId: payrollCalculations.employeeId })
        .from(payrollCalculations).where(eq(payrollCalculations.notes, period));
      const alreadyDone = new Set(
        (Array.isArray(existing) ? existing : []).map((r) => r.employeeId),
      );

      let processed = 0;
      let skipped = 0;
      let totalGross = 0;
      let totalNet = 0;
      for (const contract of activeContracts) {
        if (alreadyDone.has(contract.employeeId)) {
          skipped += 1;
          continue;
        }
        const monthlyHours = contract.monthlyHours ?? DEFAULT_MONTHLY_HOURS;
        const workHours = contract.payType === 'hourly' ? monthlyHours : 0;
        const parts = this.compute(contract, {
          workHours, productionUnits: 0,
          bonuses: 0, allowances: 0, advances: 0, loans: 0, otherDeductions: 0,
        });
        await this.insertCalc(
          contract, contract.employeeId, DEFAULT_WORK_DAYS, workHours, 0, 0, 0, parts, period,
        );
        processed += 1;
        totalGross += parts.grossPay;
        totalNet += parts.netPay;
      }
      return Ok({
        period,
        totalContracts: activeContracts.length,
        processed,
        skipped,
        totalGross,
        totalNet,
      });
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `PAYROLL_RUN_FAILED: ${String(e)}`));
    }
  }
}
