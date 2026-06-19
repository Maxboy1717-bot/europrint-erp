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
        // Soft-fail: status already flipped; return payment row with GL error noted.
        return { ok: true, data: { ...r.data, glError: String(glR.error) } };
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
