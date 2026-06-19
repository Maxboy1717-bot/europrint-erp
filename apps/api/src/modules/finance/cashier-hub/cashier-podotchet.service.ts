/**
 * @module cashier-podotchet.service
 * @description CASHIER-HUB Phase 2 — FEATURE B (podotchet: avans / qarz cycle).
 *   issueAdvance: cash given to an employee → KAS-1 cash-out (type='advance', Dr 4000 AR /
 *     Cr 5010 Cash via canonical `entries`) AND opens an employee_debt row ("har som hisobli").
 *   submitAdvanceReport: employee submits a receipt → an advance_reports row (pending).
 *   approveAdvanceReport: human approval (owner E1) → CLEARS the matching employee_debt (cleared).
 *   getEmployeeDebt: profile debt = SUM(open employee_debt.amount) + the open rows.
 *   Idempotent throughout (advance reference, report reference). No forge: cash-out reuses the
 *   KAS-1 PIN gate (owner #8); debt clears only when its report is approved.
 * @layer Application (Finance)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, AppError, AppErr, Ok, Err } from '@common/result';
import { z } from 'zod';
import { CashierHubService } from './cashier-hub.service';
import { CASHIER_PAYROLL_REPO, type ICashierPayrollRepository } from './i-cashier-payroll.repo';

const IssueAdvanceSchema = z.object({
  shiftId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  amount: z.number().positive(),
  reference: z.string().min(1).max(100), // base business ref; debt + movement derive from it
  reason: z.string().max(2000).optional(),
  pin: z.string().regex(/^\d{4}$/, "PIN 4 raqamdan iborat bo'lishi kerak"),
});

const SubmitAdvanceReportSchema = z.object({
  debtId: z.number().int().positive(),
  amount: z.number().positive(),
  receiptRef: z.string().min(1).max(200), // a receipt is mandatory (EP-FIN-026/048 — no doc, no clear)
  reference: z.string().min(1).max(120),
  notes: z.string().max(2000).optional(),
});

@Injectable()
export class CashierPodotchetService {
  private readonly logger = new Logger(CashierPodotchetService.name);

  constructor(
    @Inject(CASHIER_PAYROLL_REPO) private readonly repo: ICashierPayrollRepository,
    private readonly hub: CashierHubService,
  ) {}

  /**
   * Issue a cash advance to an employee:
   *   1) KAS-1 recordMovement(type='advance') — PIN-gated cash-out + canonical GL (Dr 4000 / Cr 5010),
   *   2) open an employee_debt row (status='open') linked to that movement.
   * Idempotent by `reference`: a re-fired advance returns the existing debt (KAS-1 also dedupes the
   * movement by its derived reference), so neither the GL nor the debt is doubled.
   */
  async issueAdvance(raw: unknown, operatorUserId?: number): Promise<Result<unknown, AppError>> {
    const validated = safeParse(IssueAdvanceSchema, raw);
    if (!validated.ok) return Err(validated.error);
    const dto = validated.data;

    const debtRef = `ADV-${dto.reference}`;

    // Idempotency: same advance reference → return the existing debt (no second cash-out/GL).
    const existingDebt = await this.repo.findDebtByReference(debtRef);
    if (!existingDebt.ok) return existingDebt as Result<never, AppError>;
    if (existingDebt.data) {
      this.logger.debug(`Advance already issued for ref ${dto.reference} (idempotent) — debt #${existingDebt.data.id}`);
      return Ok({ debt: existingDebt.data, alreadyIssued: true });
    }

    // Cash-out + GL via KAS-1 (PIN-gated, owner #8; posts Dr 4000 AR / Cr 5010 Cash to `entries`).
    const movementRes = await this.hub.recordMovement(
      dto.shiftId,
      {
        type: 'advance',
        amount: dto.amount,
        reference: debtRef,
        description: dto.reason ?? `Avans — xodim #${dto.employeeId}`,
        pin: dto.pin,
      },
      operatorUserId,
    );
    if (!movementRes.ok) return movementRes as Result<never, AppError>;
    const movement = movementRes.data as { id: number };

    const debt = await this.repo.createDebt({
      employeeId: dto.employeeId,
      amount: dto.amount,
      reason: dto.reason ?? null,
      reference: debtRef,
      movementId: movement.id,
    });
    if (!debt.ok) return debt as Result<never, AppError>;
    return Ok({ debt: debt.data, movement });
  }

  /**
   * Submit an advance report (with a mandatory receipt) against an OPEN debt. Creates a pending
   * (approved=false) advance_reports row — it does NOT clear the debt yet (human approval first,
   * owner E1). Idempotent by `reference`.
   */
  async submitAdvanceReport(raw: unknown): Promise<Result<unknown, AppError>> {
    const validated = safeParse(SubmitAdvanceReportSchema, raw);
    if (!validated.ok) return Err(validated.error);
    const dto = validated.data;

    const existing = await this.repo.findAdvanceReportByReference(dto.reference);
    if (!existing.ok) return existing as Result<never, AppError>;
    if (existing.data) {
      this.logger.debug(`Advance report already exists for ref ${dto.reference} (idempotent) — id=${existing.data.id}`);
      return Ok(existing.data);
    }

    const debtRes = await this.repo.findDebtById(dto.debtId);
    if (!debtRes.ok) return debtRes as Result<never, AppError>;
    if (!debtRes.data) return Err(AppErr('NOT_FOUND', `Qarz #${dto.debtId} topilmadi`));
    if (debtRes.data.status !== 'open') {
      return Err(AppErr('INVALID_STATUS', `Qarz #${dto.debtId} ochiq emas (holat: ${debtRes.data.status})`));
    }

    const created = await this.repo.createAdvanceReport({
      employeeId: debtRes.data.employeeId,
      debtId: dto.debtId,
      amount: dto.amount,
      receiptRef: dto.receiptRef,
      reference: dto.reference,
      notes: dto.notes ?? null,
    });
    if (!created.ok) return created as Result<never, AppError>;
    return Ok(created.data);
  }

  /**
   * Approve an advance report (human, owner E1) → CLEARS the matching open employee_debt
   * (status='cleared'). Idempotent: an already-approved report whose debt is cleared is a no-op.
   */
  async approveAdvanceReport(reportId: number, approverUserId: number): Promise<Result<unknown, AppError>> {
    const approved = await this.repo.approveAdvanceReport(reportId, approverUserId);
    if (!approved.ok) return approved as Result<never, AppError>;
    const report = approved.data;

    const debtRes = await this.repo.findDebtById(report.debtId);
    if (!debtRes.ok) return debtRes as Result<never, AppError>;
    if (!debtRes.data) return Err(AppErr('NOT_FOUND', `Bog'liq qarz #${report.debtId} topilmadi`));

    // Idempotent: if already cleared, return without erroring (re-approve is a no-op).
    if (debtRes.data.status === 'cleared') {
      return Ok({ report, debt: debtRes.data, alreadyCleared: true });
    }

    const cleared = await this.repo.clearDebt(report.debtId);
    if (!cleared.ok) return cleared as Result<never, AppError>;
    return Ok({ report, debt: cleared.data });
  }

  /** Employee profile debt: jami (SUM of open debt) + the list of open debt rows. */
  async getEmployeeDebt(employeeId: number): Promise<Result<unknown, AppError>> {
    const totalRes = await this.repo.getOpenDebtTotal(employeeId);
    if (!totalRes.ok) return totalRes as Result<never, AppError>;
    const listRes = await this.repo.listOpenDebts(employeeId);
    if (!listRes.ok) return listRes as Result<never, AppError>;
    return Ok({ employeeId, openDebtTotal: totalRes.data, openDebts: listRes.data });
  }
}

/** Local Zod helper → Result (keeps controllers thin; avoids try/catch on parse). */
function safeParse<T>(schema: z.ZodType<T>, raw: unknown): Result<T, AppError> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return Err(AppErr('VALIDATION', parsed.error.issues.map((i) => i.message).join('; ')));
  }
  return Ok(parsed.data);
}
