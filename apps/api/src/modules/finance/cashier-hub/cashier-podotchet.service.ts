/**
 * @module cashier-podotchet.service
 * @description CASHIER-HUB Phase 2 — FEATURE B (podotchet: avans / qarz cycle).
 *   issueAdvance: cash given to an employee → KAS-1 cash-out (type='advance', Dr 4000 AR /
 *     Cr 5010 Cash via canonical `entries`) AND opens an employee_debt row ("har som hisobli")
 *     with an optional expense category (finance_categories, categoryType=expense).
 *   submitAdvanceReport: employee submits a receipt → an advance_reports row (pending).
 *     Optional receipt FILE (existing /api/storage upload key) triggers AI-OCR (vizyon 16586 /
 *     "chek-AI": AI reads + compares the amount, the HUMAN gives the final approval) —
 *     GRACEFUL: no AI provider / unreadable receipt → ocr_extracted=null, flow continues.
 *   approveAdvanceReport: human approval (owner E1) → CLEARS the matching employee_debt (cleared).
 *   getEmployeeDebt: profile podotchet (vizyon 16571) = jami olingan (all debt) + ochiq qarz
 *     (open) + tasdiqda (pending reports) + sabab/kategoriya rows — separate from oylik/avans.
 *   Idempotent throughout (advance reference, report reference). No forge: cash-out reuses the
 *   KAS-1 PIN gate (owner #8); debt clears only when its report is approved.
 * @layer Application (Finance)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Result, AppError, AppErr, Ok, Err } from '@common/result';
import { z } from 'zod';
import { CashierHubService } from './cashier-hub.service';
// SHARED READ of the app-level AI router (registered by AiModule in app.module) — resolved
// LAZILY via ModuleRef{strict:false} so FinanceModule needs no AiModule import and the
// podotchet flow keeps working when AI is absent (graceful, Q-40 — no forged OCR).
import { AiRouterService } from '../../ai/application/services/ai-router.service';
import {
  CASHIER_PAYROLL_REPO,
  type ICashierPayrollRepository,
  type AdvanceReportListRow,
  type PayrollListPage,
} from './i-cashier-payroll.repo';

const IssueAdvanceSchema = z.object({
  shiftId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  amount: z.number().positive(),
  reference: z.string().min(1).max(100), // base business ref; debt + movement derive from it
  reason: z.string().max(2000).optional(),
  /** Expense category (finance_categories.id, categoryType=expense) — optional; splits the
   *  podotchet data by ODDIY_XARID/OQISH/SAFAR/ONLAYN_XARID (GL account mapping = EGASI-DATA). */
  categoryId: z.number().int().positive().optional(),
  pin: z.string().regex(/^\d{4}$/, "PIN 4 raqamdan iborat bo'lishi kerak"),
});

const SubmitAdvanceReportSchema = z.object({
  debtId: z.number().int().positive(),
  amount: z.number().positive(),
  receiptRef: z.string().min(1).max(200), // a receipt is mandatory (EP-FIN-026/048 — no doc, no clear)
  /** Storage key of the uploaded receipt image/PDF (PUT /api/storage/upload — existing infra). */
  receiptFilePath: z.string().min(1).max(500).optional(),
  reference: z.string().min(1).max(120),
  notes: z.string().max(2000).optional(),
});

/** AI-OCR extraction stored into advance_reports.ocr_extracted (null = no AI verdict). */
interface ReceiptOcrOutcome {
  extracted: Record<string, unknown> | null;
  match: boolean | null;
}

/** GET advance-reports query — optional approved-status filter ('pending'|'approved') + pagination. */
const ListAdvanceReportsQuerySchema = z.object({
  status: z.enum(['pending', 'approved']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

@Injectable()
export class CashierPodotchetService {
  private readonly logger = new Logger(CashierPodotchetService.name);

  constructor(
    @Inject(CASHIER_PAYROLL_REPO) private readonly repo: ICashierPayrollRepository,
    private readonly hub: CashierHubService,
    private readonly moduleRef: ModuleRef,
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
      categoryId: dto.categoryId ?? null,
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

    // AI-OCR (vizyon 16586 "chek-AI"): AI reads the receipt + compares the amount; the result
    // is a SIGNAL for the human approver only — approveAdvanceReport stays the final gate.
    // GRACEFUL: no AI key / no verdict → {extracted:null, match:null}, the flow never blocks.
    const ocr = dto.receiptFilePath
      ? await this.runReceiptOcr(dto.receiptFilePath, dto.amount)
      : { extracted: null, match: null };

    const created = await this.repo.createAdvanceReport({
      employeeId: debtRes.data.employeeId,
      debtId: dto.debtId,
      amount: dto.amount,
      receiptRef: dto.receiptRef,
      receiptFilePath: dto.receiptFilePath ?? null,
      ocrExtracted: ocr.extracted,
      ocrMatch: ocr.match,
      reference: dto.reference,
      notes: dto.notes ?? null,
    });
    if (!created.ok) return created as Result<never, AppError>;
    return Ok(created.data);
  }

  /**
   * Receipt AI-OCR — extracts the total amount from the uploaded receipt via the shared
   * AiRouterService (same prompt-based pattern as ai-agents vision-qc) and compares it to
   * the reported amount. NEVER throws and NEVER blocks the flow:
   *   - AI provider absent / router unavailable / call fails → {extracted:null, match:null};
   *   - AI answers but yields no numeric amount → extracted stored (audit), match=null;
   *   - only a real numeric amount produces match=true/false (no forged verdicts — Q-40).
   */
  private async runReceiptOcr(receiptFilePath: string, claimedAmount: number): Promise<ReceiptOcrOutcome> {
    let ai: AiRouterService;
    try {
      // strict:false → resolves from the root container (AiModule is app-level); FinanceModule
      // does not import AiModule. Throws when the provider is absent → graceful null path.
      ai = this.moduleRef.get(AiRouterService, { strict: false });
    } catch {
      this.logger.debug('AI-OCR o\'tkazib yuborildi — AiRouterService mavjud emas (graceful)');
      return { extracted: null, match: null };
    }

    const prompt = [
      'EuroPrint podotchet chek tekshiruvi (AI-OCR).',
      `Chek fayli (ichki storage): /api/storage/${receiptFilePath}`,
      `Xodim hisobotda ko'rsatgan summa: ${claimedAmount} UZS.`,
      'Chekdan JAMI to\'langan summani ajrating va FAQAT quyidagi JSON qaytaring:',
      '{"amount": number|null, "currency": string|null, "note": string}',
      'Agar chek mazmunini o\'qiy olmasangiz {"amount": null} qaytaring — TAXMIN QILMANG.',
    ].join('\n');

    try {
      const res = await ai.call({ taskType: 'finance.invoice_classify', prompt, temperature: 0, maxTokens: 300 });
      if (!res.ok) {
        this.logger.debug(`AI-OCR muvaffaqiyatsiz (graceful davom): ${String(res.error)}`);
        return { extracted: null, match: null };
      }
      const jsonMatch = res.data.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { extracted: null, match: null };
      const parsed = JSON.parse(jsonMatch[0]) as { amount?: unknown; currency?: unknown; note?: unknown };
      const amount = typeof parsed.amount === 'number' && Number.isFinite(parsed.amount) ? parsed.amount : null;
      const extracted: Record<string, unknown> = {
        amount,
        currency: typeof parsed.currency === 'string' ? parsed.currency : null,
        note: typeof parsed.note === 'string' ? parsed.note : null,
        provider: res.data.provider,
        model: res.data.model,
      };
      const match = amount === null ? null : Math.abs(amount - claimedAmount) < 0.01;
      return { extracted, match };
    } catch (e: unknown) {
      this.logger.debug(`AI-OCR xato (graceful davom): ${String(e)}`);
      return { extracted: null, match: null };
    }
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

  /**
   * The advance-report list (newest first) for the manager view; optional approved-status filter
   * ('pending' = awaiting approval, 'approved' = cleared). Read-only (joined to the employee name).
   */
  async listAdvanceReports(rawQuery: unknown): Promise<Result<PayrollListPage<AdvanceReportListRow>, AppError>> {
    const validated = safeParse(ListAdvanceReportsQuerySchema, rawQuery);
    if (!validated.ok) return Err(validated.error);
    const q = validated.data;
    return this.repo.listAdvanceReports({ status: q.status, limit: q.limit ?? 50, offset: q.offset ?? 0 });
  }

  /**
   * Employee profile podotchet (vizyon 16571 — jami-olgan / nimaga / tasdiqda / qarz,
   * oylik/avansdan ALOHIDA blok):
   *   openDebtTotal / openDebts  — mavjud maydonlar o'zgarishsiz (Q-39);
   *   totalIssued                — jami olingan (barcha debt: open + cleared);
   *   pendingReportTotal/-Reports— tasdiqda turgan (approved=false) hisobotlar;
   *   openDebts[].categoryId/reason — nimaga (kategoriya + sabab).
   */
  async getEmployeeDebt(employeeId: number): Promise<Result<unknown, AppError>> {
    const totalRes = await this.repo.getOpenDebtTotal(employeeId);
    if (!totalRes.ok) return totalRes as Result<never, AppError>;
    const listRes = await this.repo.listOpenDebts(employeeId);
    if (!listRes.ok) return listRes as Result<never, AppError>;
    const allTotalRes = await this.repo.getDebtTotalAll(employeeId);
    if (!allTotalRes.ok) return allTotalRes as Result<never, AppError>;
    const pendingRes = await this.repo.listPendingReportsByEmployee(employeeId);
    if (!pendingRes.ok) return pendingRes as Result<never, AppError>;
    const pendingReports = Array.isArray(pendingRes.data) ? pendingRes.data : [];
    const pendingReportTotal = pendingReports.reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
    return Ok({
      employeeId,
      openDebtTotal: totalRes.data,
      openDebts: listRes.data,
      totalIssued: allTotalRes.data,
      pendingReportTotal,
      pendingReports,
    });
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
