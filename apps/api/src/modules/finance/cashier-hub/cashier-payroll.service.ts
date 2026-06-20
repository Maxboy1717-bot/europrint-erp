/**
 * @module cashier-payroll.service
 * @description CASHIER-HUB Phase 2 — FEATURE A (KAS-2 salary-payout approval gate).
 *   A `salary_payout` cashier movement may be paid out ONLY when its approval chain is
 *   fully complete: ai_checked → hr_approved → finance_approved → director_approved
 *   (status='approved'), AND a valid 4-digit cashier PIN is supplied (owner #8). The actual
 *   cash-out + canonical GL post (Dr 6710 / Cr 5010) is delegated to KAS-1
 *   CashierHubService.recordMovement (Q-46 — reuse, do not duplicate). No forge: a missing
 *   chain, an incomplete chain, or a bad/absent PIN rejects the payout.
 * @layer Application (Finance)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, AppError, AppErr, Ok, Err } from '@common/result';
import { z } from 'zod';
import { CashierHubService } from './cashier-hub.service';
import {
  CASHIER_PAYROLL_REPO,
  type ICashierPayrollRepository,
  type ApprovalStage,
  type ApprovalListRow,
  type PayrollListPage,
} from './i-cashier-payroll.repo';

/** Ordered chain stages → the aggregate status each one sets (the last stage = 'approved'). */
const STAGE_ORDER: ReadonlyArray<{ stage: ApprovalStage; status: string }> = [
  { stage: 'ai_checked', status: 'ai_checked' },
  { stage: 'hr_approved', status: 'hr_approved' },
  { stage: 'finance_approved', status: 'finance_approved' },
  { stage: 'director_approved', status: 'approved' },
];

const RequestSalaryPayoutSchema = z.object({
  employeeId: z.number().int().positive(),
  amount: z.number().positive(),
  reference: z.string().min(1).max(120),
  notes: z.string().max(2000).optional(),
});

const ApproveStageSchema = z.object({
  stage: z.enum(['ai_checked', 'hr_approved', 'finance_approved', 'director_approved']),
});

/** GET salary-payouts query — the approval queue. Defaults to status='pending'; 'all' lifts the filter. */
const ListApprovalsQuerySchema = z.object({
  status: z.string().min(1).max(20).default('pending'),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const RejectSchema = z.object({
  reason: z.string().min(1).max(2000),
});

const RecordSalaryPayoutSchema = z.object({
  shiftId: z.number().int().positive(),
  reference: z.string().min(1).max(120), // the approval chain's reference
  pin: z.string().regex(/^\d{4}$/, "PIN 4 raqamdan iborat bo'lishi kerak"),
  description: z.string().max(2000).optional(),
});

@Injectable()
export class CashierPayrollService {
  private readonly logger = new Logger(CashierPayrollService.name);

  constructor(
    @Inject(CASHIER_PAYROLL_REPO) private readonly repo: ICashierPayrollRepository,
    private readonly hub: CashierHubService,
  ) {}

  /**
   * Open a salary-payout approval chain for an employee+amount. Idempotent by reference —
   * a re-request with the same reference returns the existing chain (no duplicate row).
   */
  async requestSalaryPayout(raw: unknown): Promise<Result<unknown, AppError>> {
    const validated = safeParse(RequestSalaryPayoutSchema, raw);
    if (!validated.ok) return Err(validated.error);
    const dto = validated.data;

    const existing = await this.repo.findApprovalByReference(dto.reference);
    if (!existing.ok) return existing as Result<never, AppError>;
    if (existing.data) {
      this.logger.debug(`Approval chain already exists for ref ${dto.reference} (idempotent) — id=${existing.data.id}`);
      return Ok(existing.data);
    }

    const created = await this.repo.createApproval({
      employeeId: dto.employeeId,
      amount: dto.amount,
      reference: dto.reference,
      notes: dto.notes ?? null,
    });
    if (!created.ok) return created as Result<never, AppError>;
    return Ok(created.data);
  }

  /**
   * The salary-payout approval queue (newest first). Defaults to status='pending'; pass status='all'
   * to lift the filter. Read-only manager view (joined to the employee name).
   */
  async listSalaryPayouts(rawQuery: unknown): Promise<Result<PayrollListPage<ApprovalListRow>, AppError>> {
    const validated = safeParse(ListApprovalsQuerySchema, rawQuery);
    if (!validated.ok) return Err(validated.error);
    const q = validated.data;
    return this.repo.listApprovals({
      status: q.status === 'all' ? undefined : q.status,
      limit: q.limit ?? 50,
      offset: q.offset ?? 0,
    });
  }

  /**
   * Advance one stage of the chain. Stages MUST be approved in order
   * (ai_checked → hr_approved → finance_approved → director_approved); approving out of order
   * or a stage already past is rejected. director_approved sets status='approved'.
   */
  async approveStage(approvalId: number, raw: unknown, approverUserId: number): Promise<Result<unknown, AppError>> {
    const validated = safeParse(ApproveStageSchema, raw);
    if (!validated.ok) return Err(validated.error);
    const targetStage = validated.data.stage;

    const found = await this.repo.findApprovalById(approvalId);
    if (!found.ok) return found as Result<never, AppError>;
    if (!found.data) return Err(AppErr('NOT_FOUND', `Tasdiq zanjiri #${approvalId} topilmadi`));
    const chain = found.data;

    if (chain.status === 'rejected') return Err(AppErr('INVALID_STATUS', `Zanjir #${approvalId} rad etilgan`));
    if (chain.status === 'approved') return Err(AppErr('INVALID_STATUS', `Zanjir #${approvalId} allaqachon to'liq tasdiqlangan`));

    const targetIdx = STAGE_ORDER.findIndex((s) => s.stage === targetStage);
    const nextIdx = this.nextStageIndex(chain);
    if (targetIdx !== nextIdx) {
      return Err(
        AppErr('INVALID_STATUS', `KAS-2: bosqichlar tartib bilan tasdiqlanadi — keyingisi: ${STAGE_ORDER[nextIdx]?.stage ?? 'yo\'q'}`),
      );
    }

    const updated = await this.repo.setApprovalStage(approvalId, targetStage, approverUserId, STAGE_ORDER[targetIdx].status);
    if (!updated.ok) return updated as Result<never, AppError>;
    return Ok(updated.data);
  }

  /** Reject the chain (any stage). A rejected chain can never be paid out. */
  async rejectApproval(approvalId: number, raw: unknown, rejectedBy: number): Promise<Result<unknown, AppError>> {
    const validated = safeParse(RejectSchema, raw);
    if (!validated.ok) return Err(validated.error);

    const found = await this.repo.findApprovalById(approvalId);
    if (!found.ok) return found as Result<never, AppError>;
    if (!found.data) return Err(AppErr('NOT_FOUND', `Tasdiq zanjiri #${approvalId} topilmadi`));
    if (found.data.status === 'approved') return Err(AppErr('INVALID_STATUS', "To'liq tasdiqlangan zanjirni rad etib bo'lmaydi"));

    const rejected = await this.repo.rejectApproval(approvalId, rejectedBy, validated.data.reason);
    if (!rejected.ok) return rejected as Result<never, AppError>;
    return Ok(rejected.data);
  }

  /**
   * Pay out a salary via the cashier. GATED: the referenced approval chain must be fully
   * approved (status='approved') AND a valid 4-digit PIN must verify (both enforced — owner #8).
   * Delegates the real cash-out + canonical GL post (Dr 6710 / Cr 5010) to KAS-1 recordMovement,
   * then marks the chain paid (links the movement). Idempotent: a chain already paid returns its
   * movement without a second GL post.
   */
  async recordSalaryPayout(raw: unknown, operatorUserId?: number): Promise<Result<unknown, AppError>> {
    const validated = safeParse(RecordSalaryPayoutSchema, raw);
    if (!validated.ok) return Err(validated.error);
    const dto = validated.data;

    const found = await this.repo.findApprovalByReference(dto.reference);
    if (!found.ok) return found as Result<never, AppError>;
    if (!found.data) {
      return Err(AppErr('NOT_FOUND', `KAS-2: tasdiq zanjiri topilmadi (ref ${dto.reference}) — to'lov rad etildi`));
    }
    const chain = found.data;

    // Gate 1 — the chain MUST be fully approved (director_approved set). No forge.
    if (chain.status !== 'approved') {
      return Err(
        AppErr(
          'FORBIDDEN',
          `KAS-2: ish haqi to'lovi BLOK — tasdiq zanjiri to'liq emas (holat: ${chain.status}). ` +
            `Kerak: ai_checked → hr_approved → finance_approved → director_approved`,
        ),
      );
    }

    // Idempotency: this chain was already paid → return the recorded movement (no double pay).
    if (chain.paidMovementId) {
      this.logger.debug(`Salary payout already paid for ref ${dto.reference} (movement #${chain.paidMovementId})`);
      return Ok({ approval: chain, movementId: chain.paidMovementId, alreadyPaid: true });
    }

    // Gate 2 + GL — delegate to KAS-1 recordMovement: it PIN-verifies (owner #8) and posts the
    // canonical GL (Dr 6710 Salary Payable / Cr 5010 Cash) via GlPostingService → `entries`.
    const movementRes = await this.hub.recordMovement(
      dto.shiftId,
      {
        type: 'salary_payout',
        amount: Number(chain.amount),
        reference: `SALPAY-${dto.reference}`,
        description: dto.description ?? `Ish haqi to'lovi — xodim #${chain.employeeId}`,
        pin: dto.pin,
      },
      operatorUserId,
    );
    if (!movementRes.ok) return movementRes as Result<never, AppError>;
    const movement = movementRes.data as { id: number };

    const paid = await this.repo.markApprovalPaid(chain.id, movement.id);
    if (!paid.ok) return paid as Result<never, AppError>;
    return Ok({ approval: paid.data, movement });
  }

  /** Index of the next stage to approve (0..3), or STAGE_ORDER.length if all done. */
  private nextStageIndex(chain: { aiCheckedAt: unknown; hrApprovedAt: unknown; financeApprovedAt: unknown; directorApprovedAt: unknown }): number {
    if (!chain.aiCheckedAt) return 0;
    if (!chain.hrApprovedAt) return 1;
    if (!chain.financeApprovedAt) return 2;
    if (!chain.directorApprovedAt) return 3;
    return STAGE_ORDER.length;
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
