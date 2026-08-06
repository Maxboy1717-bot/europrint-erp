/**
 * @module finance-actions.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { FINANCE_ACTIONS_REPO, type IFinanceActionsRepo } from '../domain/repositories/i-finance-actions.repo';
import { Result } from '@common/result';
import { GlPostingService } from '../domain/services/gl-posting.service';

type Row = Record<string, unknown>;

@Injectable()
export class FinanceActionsService {
  private readonly logger = new Logger(FinanceActionsService.name);

  constructor(
    @Inject(FINANCE_ACTIONS_REPO) private readonly repo: IFinanceActionsRepo,
    private readonly glPostingService: GlPostingService,
  ) {}

  getSalaryBenchmark(): Promise<Result<Row>> {
    return this.repo.getSalaryBenchmark();
  }

  approvePayment(id: number, approvedBy: number | string): Promise<Result<Row>> {
    return this.repo.approvePayment(id, approvedBy);
  }

  /**
   * Verify a payment: flip status to 'verified', then post the cash-receipt GL journal
   * (Dr Cash 5010 / Cr AR 4000) to the canonical `entries` table.
   * Idempotent: GlPostingService.createJournalEntry checks for existing reference `CP-{id}`.
   * If the GL post fails we still return the payment row (soft-fail logged) so the status
   * flip is not rolled back — GL can be re-posted via POST /finance/gl/post-sales-invoice.
   */
  async verifyPayment(id: number, verifiedBy: number): Promise<Result<Row>> {
    const r = await this.repo.verifyPayment(id, verifiedBy);
    if (!r.ok) return r;

    const amount = parseFloat(String((r.data as Row)['amount'] ?? '0'));
    if (amount > 0) {
      const glR = await this.glPostingService.postCustomerPayment(id, amount);
      if (!glR.ok) {
        this.logger.error(
          `verifyPayment: GL post failed for payment id=${id} amount=${amount}: ${String(glR.error)}`,
        );
        // audit 2026-08-06 T25: was the weakest money↔GL window — status stayed
        // 'verified' with no GL entry and only a glError field nobody watched.
        // Now compensate: revert to the captured pre-verify status (same pattern
        // as record-payment.handler's reverseInvoicePayment). If even the revert
        // fails, log CRITICAL so ops can reconcile by hand.
        const prev = String((r.data as Row)['previous_status'] ?? 'approved');
        const revert = await this.repo.setPaymentStatus(id, prev);
        if (!revert.ok) {
          this.logger.error(
            `CRITICAL: verifyPayment GL post AND compensation both failed — payment id=${id} left 'verified' WITHOUT a GL entry (wanted revert to '${prev}'): ${String(revert.error)}`,
          );
          return { ok: true, data: { ...r.data, glError: String(glR.error), compensationFailed: true } };
        }
        return {
          ok: false,
          error: { code: 'EXTERNAL_5XX', message: `GL post muvaffaqiyatsiz — to'lov holati '${prev}'ga qaytarildi: ${String(glR.error)}` },
        } as Result<Row>;
      }
      return { ok: true, data: { ...r.data, glEntryId: glR.data } };
    }

    return r;
  }

  listAdvances(lim: number, off: number, page: number) {
    return this.repo.listAdvances(lim, off, page);
  }

  getPendingAdvances() {
    return this.repo.getPendingAdvances();
  }

  createApEntry(data: Record<string, unknown>) {
    return this.repo.createApEntry(data);
  }

  createArEntry(data: Record<string, unknown>) {
    return this.repo.createArEntry(data);
  }
}
