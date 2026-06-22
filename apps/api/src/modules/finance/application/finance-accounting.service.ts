/**
 * @module finance-accounting.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { safeInt } from '../../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { DrizzleFinanceAccountingRepo } from '../infrastructure/repositories/drizzle-finance-accounting.repo';
import { GlPostingService, JournalLine } from '../domain/services/gl-posting.service';

@Injectable()
export class FinanceAccountingService {
  private readonly logger = new Logger(FinanceAccountingService.name);

  constructor(
    private readonly accountingRepo: DrizzleFinanceAccountingRepo,
    private readonly glPosting: GlPostingService,
  ) {}

  async getDashboard() {
    return this.accountingRepo.getDashboard();
  }

  async getAccounts(type?: string, limit = 50, offset = 0) {
    const result = await this.accountingRepo.findAccounts(type, limit, offset);
    if (!result.ok) {
      this.logger.error('getAccounts error', result.error);
      return { items: [] as Record<string, unknown>[], total: 0 };
    }
    return { items: result.data, total: result.data.length };
  }

  async getGlDocuments(status?: string, documentType?: string, startDate?: string, endDate?: string, limitParam?: string, offsetParam?: string) {
    const limitVal  = safeInt(limitParam, 50);
    const offsetVal = safeInt(offsetParam, 0);
    return this.accountingRepo.getGlDocumentsFiltered({ status, documentType, startDate, endDate }, limitVal, offsetVal);
  }

  /**
   * Create a GL document = post a BALANCED double-entry journal to the canonical `entries` ledger
   * (SAP#76: `entries` is the ONE money ledger; gl_lines/gl_documents are NOT the ledger of record).
   * Mirrors FiService.createGlDoc — POST /api/accounting/gl-documents is now HONEST.
   *
   * Honest contract (Q-40, Q-43):
   *  - Each request line carries an account code (`accountCode`, or a code string in `account_id`)
   *    plus `debit`/`credit`.
   *  - If ΣDebit == ΣCredit (within 0.01) AND there is ≥1 debit leg and ≥1 credit leg, we post real
   *    balanced rows via the ONE engine (GlPostingService → resolves codes → accounts.id → INSERT
   *    into `entries`). No header is written to gl_documents; no gl_lines are written.
   *  - Otherwise we return a CLEAR 400. We do NOT silently persist a header, do NOT write gl_lines,
   *    and do NOT invent a contra account.
   */
  async createGlDocument(body: Record<string, unknown>) {
    const rawLines = Array.isArray(body.lines) ? (body.lines as Array<Record<string, unknown>>) : [];
    if (rawLines.length === 0) {
      throw new BadRequestException(
        "GL hujjati uchun kamida ikkita yozuv (debet va kredit) kerak. Bo'sh hujjat saqlanmaydi.",
      );
    }

    // Map each document line to a JournalLine. The account is identified by code (`accountCode`);
    // `account_id` is accepted only when it is itself a code string (no silent wrong-account post).
    const lines: JournalLine[] = rawLines.map((l) => {
      const accountCode = String(l.accountCode ?? l.account_id ?? l.accountId ?? '').trim();
      const debit = Number(l.debit ?? l.debitAmount ?? l.debit_amount ?? 0) || 0;
      const credit = Number(l.credit ?? l.creditAmount ?? l.credit_amount ?? 0) || 0;
      const accountName = String(l.accountName ?? l.account_name ?? accountCode);
      return { accountCode, accountName, debit, credit };
    });

    const totalDebit = lines.reduce((s, l) => s + (l.debit > 0 ? l.debit : 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit > 0 ? l.credit : 0), 0);
    const hasDebitLeg = lines.some((l) => l.debit > 0);
    const hasCreditLeg = lines.some((l) => l.credit > 0);

    // Double-entry balance is REQUIRED. An unbalanced / single-leg document is rejected here
    // (an honest error beats a fake-green header).
    if (!hasDebitLeg || !hasCreditLeg || Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Ikki tomonlama balans talab qilinadi: debet (${totalDebit}) = kredit (${totalCredit}) ` +
          `bo'lishi shart va kamida bitta debet hamda bitta kredit yozuvi (kontra hisob) kerak. ` +
          `Kontra hisob avtomatik tanlanmaydi — uni hujjat yozuvlariga qo'shing.`,
      );
    }

    // Balanced → post to the canonical entries ledger via the ONE engine.
    const reference = String(body.documentNumber ?? body.document_number ?? `GLDOC-${Date.now()}`);
    const posted = await this.glPosting.postJournal(lines, reference);
    if (!posted.ok) {
      // Account-not-in-chart / DB failures surface honestly (no header, no gl_lines).
      throw new BadRequestException(
        typeof posted.error === 'string' ? posted.error : posted.error.message,
      );
    }

    return {
      entryId: posted.data,
      reference,
      documentDate: body.documentDate ?? body.document_date ?? null,
      description: body.description ?? null,
      totalDebit,
      totalCredit,
      lines,
      ledger: 'entries',
    };
  }

  async getPeriods() {
    return this.accountingRepo.getPeriods();
  }

  async getPeriod(id: number) {
    return this.accountingRepo.getPeriodById(id);
  }

  async closePeriod(id: number, closedBy: number | null) {
    return this.accountingRepo.closePeriod(id, closedBy);
  }

  async getMaterials(warehouseId?: string, startDate?: string, endDate?: string, moveType?: string, limitParam?: string, offsetParam?: string) {
    const limitVal  = safeInt(limitParam, 100);
    const offsetVal = safeInt(offsetParam, 0);
    return this.accountingRepo.getMaterialsFiltered({ warehouseId, startDate, endDate, moveType }, limitVal, offsetVal);
  }

  async getMaterialsByOrder(orderId: string) {
    const { moves, summary } = await this.accountingRepo.getMaterialsByOrder(orderId);
    const s = summary as Record<string, unknown>;
    return {
      moves,
      summary: { totalQuantity: Number(s.total_quantity) || 0, totalCost: Number(s.total_cost) || 0, moveCount: Number(s.move_count) || 0 },
    };
  }

  async getInventoryValuation() {
    const { materials, summary } = await this.accountingRepo.getInventoryValuation();
    const s = summary as Record<string, unknown>;
    return {
      materials,
      summary: { totalItems: Number(s.total_items) || 0, totalStock: Number(s.total_stock) || 0, totalValue: Number(s.total_value) || 0 },
    };
  }

  async getExpenseReports(status?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const statusParam = status ?? null;
    const r: Result<Record<string, unknown>[]> = await safeCall(() => this.accountingRepo.getExpenseReports(statusParam, limit, offset));
    if (!r.ok) { this.logger.warn(`getExpenseReports: ${r.error}`); return { data: [], pagination: { total: 0, page, limit } }; }
    return { data: r.data, pagination: { total: r.data.length, page, limit } };
  }

  async getExpenseReportById(id: string) {
    const r = await safeCall(() => this.accountingRepo.getExpenseReportById(id));
    if (!r.ok) { this.logger.warn(`getExpenseReportById(${id}): ${r.error}`); throw new NotFoundException(String(r.error)); }
    return r.data;
  }
}
