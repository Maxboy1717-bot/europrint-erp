/**
 * @module drizzle-cashier-payroll.repo
 * @description Drizzle implementation of the CASHIER-HUB Phase 2 repository (KAS-2 approval
 *   chain + podotchet debt/report). Real INSERT/UPDATE against salary_payout_approvals /
 *   employee_debt / advance_reports (no echo, no fake-green — Q-40). Returns Result<T>.
 *   Tables come from @workspace/db (canonical lib/db build), mirroring drizzle-cashier-hub.repo.
 * @layer Infrastructure (Finance)
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { salaryPayoutApprovals, employeeDebt, advanceReports } from '@workspace/db';
import { and, eq, sql } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';
import type {
  ICashierPayrollRepository,
  ApprovalStage,
  CreateSalaryApprovalDto,
  CreateDebtDto,
  CreateAdvanceReportDto,
} from './i-cashier-payroll.repo';
import type { SalaryPayoutApproval, EmployeeDebt, AdvanceReport } from '@workspace/db';

/** Maps an approval stage → the {by, at} column pair to stamp. */
const STAGE_COLUMNS: Record<ApprovalStage, { byCol: keyof typeof salaryPayoutApprovals.$inferInsert; atCol: keyof typeof salaryPayoutApprovals.$inferInsert }> = {
  ai_checked: { byCol: 'aiCheckedBy', atCol: 'aiCheckedAt' },
  hr_approved: { byCol: 'hrApprovedBy', atCol: 'hrApprovedAt' },
  finance_approved: { byCol: 'financeApprovedBy', atCol: 'financeApprovedAt' },
  director_approved: { byCol: 'directorApprovedBy', atCol: 'directorApprovedAt' },
};

@Injectable()
export class DrizzleCashierPayrollRepository implements ICashierPayrollRepository {
  // ---------- FEATURE A: salary-payout approval chain ----------
  async findApprovalByReference(reference: string): Promise<Result<SalaryPayoutApproval | null>> {
    try {
      const rows = await db
        .select()
        .from(salaryPayoutApprovals)
        .where(eq(salaryPayoutApprovals.reference, reference))
        .limit(1);
      return Ok((rows[0] ?? null) as SalaryPayoutApproval | null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `SALARY_APPROVAL_REF_LOOKUP_FAILED: ${String(e)}`));
    }
  }

  async findApprovalById(id: number): Promise<Result<SalaryPayoutApproval | null>> {
    try {
      const rows = await db.select().from(salaryPayoutApprovals).where(eq(salaryPayoutApprovals.id, id)).limit(1);
      return Ok((rows[0] ?? null) as SalaryPayoutApproval | null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `SALARY_APPROVAL_LOOKUP_FAILED: ${String(e)}`));
    }
  }

  async createApproval(dto: CreateSalaryApprovalDto): Promise<Result<SalaryPayoutApproval>> {
    try {
      const inserted = await db
        .insert(salaryPayoutApprovals)
        .values({
          employeeId: dto.employeeId,
          amount: dto.amount,
          reference: dto.reference,
          status: 'pending',
          notes: dto.notes ?? null,
        })
        .returning();
      if (!inserted[0]) return Err(AppErr('DB_ERROR', 'Tasdiq zanjiri yaratilmadi — INSERT qaytarmadi'));
      return Ok(inserted[0] as SalaryPayoutApproval);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `SALARY_APPROVAL_CREATE_FAILED: ${String(e)}`));
    }
  }

  async setApprovalStage(
    id: number,
    stage: ApprovalStage,
    approverUserId: number,
    newStatus: string,
  ): Promise<Result<SalaryPayoutApproval>> {
    try {
      const cols = STAGE_COLUMNS[stage];
      const updated = await db
        .update(salaryPayoutApprovals)
        .set({
          [cols.byCol]: approverUserId,
          [cols.atCol]: new Date(),
          status: newStatus,
          updatedAt: new Date(),
        } as Partial<typeof salaryPayoutApprovals.$inferInsert>)
        .where(eq(salaryPayoutApprovals.id, id))
        .returning();
      if (!updated[0]) return Err(AppErr('DB_ERROR', 'Tasdiq bosqichi saqlanmadi — UPDATE qaytarmadi'));
      return Ok(updated[0] as SalaryPayoutApproval);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `SALARY_APPROVAL_STAGE_FAILED: ${String(e)}`));
    }
  }

  async rejectApproval(id: number, rejectedBy: number, reason: string): Promise<Result<SalaryPayoutApproval>> {
    try {
      const updated = await db
        .update(salaryPayoutApprovals)
        .set({ status: 'rejected', rejectedBy, rejectedAt: new Date(), rejectionReason: reason, updatedAt: new Date() })
        .where(eq(salaryPayoutApprovals.id, id))
        .returning();
      if (!updated[0]) return Err(AppErr('DB_ERROR', 'Rad etilmadi — UPDATE qaytarmadi'));
      return Ok(updated[0] as SalaryPayoutApproval);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `SALARY_APPROVAL_REJECT_FAILED: ${String(e)}`));
    }
  }

  async markApprovalPaid(id: number, movementId: number): Promise<Result<SalaryPayoutApproval>> {
    try {
      const updated = await db
        .update(salaryPayoutApprovals)
        .set({ paidMovementId: movementId, updatedAt: new Date() })
        .where(eq(salaryPayoutApprovals.id, id))
        .returning();
      if (!updated[0]) return Err(AppErr('DB_ERROR', "To'lov belgilanmadi — UPDATE qaytarmadi"));
      return Ok(updated[0] as SalaryPayoutApproval);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `SALARY_APPROVAL_PAID_FAILED: ${String(e)}`));
    }
  }

  // ---------- FEATURE B: podotchet (advance / debt) ----------
  async findDebtByReference(reference: string): Promise<Result<EmployeeDebt | null>> {
    try {
      const rows = await db.select().from(employeeDebt).where(eq(employeeDebt.reference, reference)).limit(1);
      return Ok((rows[0] ?? null) as EmployeeDebt | null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `EMPLOYEE_DEBT_REF_LOOKUP_FAILED: ${String(e)}`));
    }
  }

  async findDebtById(id: number): Promise<Result<EmployeeDebt | null>> {
    try {
      const rows = await db.select().from(employeeDebt).where(eq(employeeDebt.id, id)).limit(1);
      return Ok((rows[0] ?? null) as EmployeeDebt | null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `EMPLOYEE_DEBT_LOOKUP_FAILED: ${String(e)}`));
    }
  }

  async createDebt(dto: CreateDebtDto): Promise<Result<EmployeeDebt>> {
    try {
      const inserted = await db
        .insert(employeeDebt)
        .values({
          employeeId: dto.employeeId,
          amount: dto.amount,
          reason: dto.reason ?? null,
          status: 'open',
          reference: dto.reference,
          movementId: dto.movementId ?? null,
        })
        .returning();
      if (!inserted[0]) return Err(AppErr('DB_ERROR', 'Qarz yaratilmadi — INSERT qaytarmadi'));
      return Ok(inserted[0] as EmployeeDebt);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `EMPLOYEE_DEBT_CREATE_FAILED: ${String(e)}`));
    }
  }

  async clearDebt(id: number): Promise<Result<EmployeeDebt>> {
    try {
      // Only an OPEN debt can be cleared (guards a double-clear race).
      const updated = await db
        .update(employeeDebt)
        .set({ status: 'cleared', clearedAt: new Date() })
        .where(and(eq(employeeDebt.id, id), eq(employeeDebt.status, 'open')))
        .returning();
      if (!updated[0]) return Err(AppErr('INVALID_STATUS', `Qarz #${id} ochiq emas yoki topilmadi — yopilmadi`));
      return Ok(updated[0] as EmployeeDebt);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `EMPLOYEE_DEBT_CLEAR_FAILED: ${String(e)}`));
    }
  }

  async getOpenDebtTotal(employeeId: number): Promise<Result<number>> {
    try {
      const rows = await db
        .select({ total: sql<string>`COALESCE(SUM(${employeeDebt.amount}), 0)` })
        .from(employeeDebt)
        .where(and(eq(employeeDebt.employeeId, employeeId), eq(employeeDebt.status, 'open')));
      return Ok(Number(rows[0]?.total ?? 0));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `EMPLOYEE_DEBT_TOTAL_FAILED: ${String(e)}`));
    }
  }

  async listOpenDebts(employeeId: number): Promise<Result<EmployeeDebt[]>> {
    try {
      const rows = await db
        .select()
        .from(employeeDebt)
        .where(and(eq(employeeDebt.employeeId, employeeId), eq(employeeDebt.status, 'open')))
        .orderBy(employeeDebt.id);
      return Ok(rows as EmployeeDebt[]);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `EMPLOYEE_DEBT_LIST_FAILED: ${String(e)}`));
    }
  }

  async findAdvanceReportByReference(reference: string): Promise<Result<AdvanceReport | null>> {
    try {
      const rows = await db.select().from(advanceReports).where(eq(advanceReports.reference, reference)).limit(1);
      return Ok((rows[0] ?? null) as AdvanceReport | null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `ADVANCE_REPORT_REF_LOOKUP_FAILED: ${String(e)}`));
    }
  }

  async createAdvanceReport(dto: CreateAdvanceReportDto): Promise<Result<AdvanceReport>> {
    try {
      const inserted = await db
        .insert(advanceReports)
        .values({
          employeeId: dto.employeeId,
          debtId: dto.debtId,
          amount: dto.amount,
          receiptRef: dto.receiptRef ?? null,
          approved: false,
          reference: dto.reference,
          notes: dto.notes ?? null,
        })
        .returning();
      if (!inserted[0]) return Err(AppErr('DB_ERROR', 'Avans hisoboti yaratilmadi — INSERT qaytarmadi'));
      return Ok(inserted[0] as AdvanceReport);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `ADVANCE_REPORT_CREATE_FAILED: ${String(e)}`));
    }
  }

  async approveAdvanceReport(id: number, approvedBy: number): Promise<Result<AdvanceReport>> {
    try {
      const updated = await db
        .update(advanceReports)
        .set({ approved: true, approvedBy, approvedAt: new Date() })
        .where(eq(advanceReports.id, id))
        .returning();
      if (!updated[0]) return Err(AppErr('DB_ERROR', 'Avans hisoboti tasdiqlanmadi — UPDATE qaytarmadi'));
      return Ok(updated[0] as AdvanceReport);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `ADVANCE_REPORT_APPROVE_FAILED: ${String(e)}`));
    }
  }
}
