/**
 * @module gl-posting.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { GL } from "../constants/gl-accounts.constants";
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result, Err, Ok } from '@common/result';
import { IGlPostingRepository, GL_POSTING_REPO } from '../repositories/i-gl-posting.repo';
import { TashkentTimeService } from '@common/time';

const _time = new TashkentTimeService();

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

@Injectable()
export class GlPostingService {
  private readonly logger = new Logger(GlPostingService.name);

  constructor(
    @Inject(GL_POSTING_REPO) private readonly glPostingRepo: IGlPostingRepository,
  ) {}

  async postSalesInvoice(invoiceId: number | string, amount: number, tax: number): Promise<Result<number>> {
    this.logger.debug(`Posting Sales Invoice - ID: ${invoiceId}, Amount: ${amount}, Tax: ${tax}`);
    // F2 data-quality gate: a GL entry must trace to a real finance_invoices row (ACCOUNTING-STANDARDS-AUDIT-2026-07-06).
    const invoiceIdNum = Number(invoiceId);
    if (!Number.isFinite(invoiceIdNum)) {
      return Err(`EP-FIN-DATA-QUALITY: invoiceId noto'g'ri (${invoiceId}) — manbasiz GL yozuvi rad etildi`);
    }
    const invoiceExists = await this.glPostingRepo.financeInvoiceExists(invoiceIdNum);
    if (!invoiceExists.ok) return Err(invoiceExists.error);
    if (!invoiceExists.data) {
      return Err(`EP-FIN-DATA-QUALITY: finance_invoices #${invoiceIdNum} topilmadi — manbasiz GL yozuvi rad etildi`);
    }
    const lines: JournalLine[] = [
      { accountCode: GL.ACCOUNTS_RECEIVABLE_TRADE, accountName: 'Accounts Receivable', debit: amount + tax, credit: 0 },
      { accountCode: GL.REVENUE, accountName: 'Sales Revenue', debit: 0, credit: amount },
      { accountCode: GL.SALES_TAX_PAYABLE, accountName: 'Sales Tax Payable', debit: 0, credit: tax },
    ];
    return this.createJournalEntry(lines, `SI-${invoiceId}`);
  }

  async postCustomerPayment(paymentId: number, amount: number): Promise<Result<number>> {
    this.logger.debug(`Posting Customer Payment - ID: ${paymentId}, Amount: ${amount}`);
    const lines: JournalLine[] = [
      { accountCode: GL.CASH, accountName: 'Cash', debit: amount, credit: 0 },
      { accountCode: GL.ACCOUNTS_RECEIVABLE_TRADE, accountName: 'Accounts Receivable', debit: 0, credit: amount },
    ];
    return this.createJournalEntry(lines, `CP-${paymentId}`);
  }

  async postGoodsReceipt(grId: number, amount: number): Promise<Result<number>> {
    this.logger.debug(`Posting Goods Receipt - ID: ${grId}, Amount: ${amount}`);
    const lines: JournalLine[] = [
      { accountCode: GL.INVENTORY, accountName: 'Inventory', debit: amount, credit: 0 },
      { accountCode: GL.ACCOUNTS_PAYABLE, accountName: 'Accounts Payable', debit: 0, credit: amount },
    ];
    return this.createJournalEntry(lines, `GR-${grId}`);
  }

  async postVendorPayment(paymentId: number, amount: number): Promise<Result<number>> {
    this.logger.debug(`Posting Vendor Payment - ID: ${paymentId}, Amount: ${amount}`);
    const lines: JournalLine[] = [
      { accountCode: GL.ACCOUNTS_PAYABLE, accountName: 'Accounts Payable', debit: amount, credit: 0 },
      { accountCode: GL.CASH, accountName: 'Cash', debit: 0, credit: amount },
    ];
    return this.createJournalEntry(lines, `VP-${paymentId}`);
  }

  async postMaterialConsumption(goodsIssueId: number, amount: number): Promise<Result<number>> {
    this.logger.debug(`Posting Material Consumption - ID: ${goodsIssueId}, Amount: ${amount}`);
    const lines: JournalLine[] = [
      { accountCode: GL.COGS, accountName: 'Cost of Goods Manufactured', debit: amount, credit: 0 },
      { accountCode: GL.INVENTORY, accountName: 'Inventory', debit: 0, credit: amount },
    ];
    return this.createJournalEntry(lines, `MC-${goodsIssueId}`);
  }

  async postPayroll(payrollId: number, gross: number): Promise<Result<number>> {
    this.logger.debug(`Posting Payroll - ID: ${payrollId}, Gross: ${gross}`);
    // ERP gross-only: payroll-tax (INPS/JSHD) GL legs are posted in 1C, not here.
    // Balanced gross entry: Dr Salary Expense / Cr Salary Payable.
    const lines: JournalLine[] = [
      { accountCode: GL.SALARY_EXPENSE, accountName: 'Salary Expense', debit: gross, credit: 0 },
      { accountCode: GL.SALARY_PAYABLE, accountName: 'Salary Payable', debit: 0, credit: gross },
    ];
    const result = await this.createJournalEntry(lines, `PR-${payrollId}`);
    if (result.ok) this.logger.log(`Payroll posted - Entry ID: ${result.data}`);
    return result;
  }

  /**
   * Public entry point for other modules to post a balanced multi-leg journal through the ONE engine
   * (resolves GL codes → accounts.id, validates ΣDR==ΣCR, writes balanced pair-rows to `entries._id`).
   * Use this instead of bespoke per-module INSERTs into `entries`. Optional createdBy attributes the
   * posting to whoever approved it — otherwise `entries.created_by` is left NULL (see F3 migration of
   * the POS bespoke writer, which needs this to preserve its pre-existing attribution).
   */
  async postJournal(lines: JournalLine[], reference: string, createdBy?: number): Promise<Result<number>> {
    return this.createJournalEntry(lines, reference, createdBy);
  }

  /**
   * EP-FIN-005 (golden thread T-14): Delivery completed → full sales-invoice GL split, posted to the
   * canonical `entries` ledger only (never gl_journal_entries / gl_lines — SAP#76 forbidden).
   *
   * Double-entry, two balanced pairs (5 legs collapsed by createJournalEntry into balanced rows):
   *   Dr AR (4000)            +totalAmount
   *     Cr Revenue (9010)         -(totalAmount - tax)   ← net of VAT
   *     Cr Sales Tax (6310)       -tax                   ← 12% UZ VAT
   *   Dr COGS (9100)          +costOfGoods               ← cost recognised on delivery
   *     Cr Inventory (1000)       -costOfGoods           ← goods leave stock
   *
   * Balance check (enforced by createJournalEntry):
   *   ΣDr  = totalAmount + costOfGoods
   *   ΣCr  = (totalAmount - tax) + tax + costOfGoods = totalAmount + costOfGoods  ✓
   *
   * Idempotent: reference `DC-${orderId}` — a re-fired DeliveryCompletedEvent returns the existing
   * entry id without a second post (findEntryIdByReference covers it).
   */
  async postDeliveryCompleted(
    orderId: number,
    totalAmount: number,
    tax: number,
    costOfGoods: number,
  ): Promise<Result<number>> {
    this.logger.debug(
      `EP-FIN-005 delivery GL - Order: ${orderId}, Total: ${totalAmount}, Tax: ${tax}, COGS: ${costOfGoods}`,
    );
    if (!(totalAmount > 0)) {
      return Err(`EP-FIN-005: totalAmount must be > 0 (got ${totalAmount})`);
    }
    if (costOfGoods < 0 || tax < 0) {
      return Err(`EP-FIN-005: tax/costOfGoods must be >= 0 (tax=${tax}, cogs=${costOfGoods})`);
    }
    // F2 data-quality gate: a GL entry must trace to a real sales_orders row (ACCOUNTING-STANDARDS-AUDIT-2026-07-06).
    const orderExists = await this.glPostingRepo.salesOrderExists(orderId);
    if (!orderExists.ok) return Err(orderExists.error);
    if (!orderExists.data) {
      return Err(`EP-FIN-DATA-QUALITY: sales_orders #${orderId} topilmadi — manbasiz GL yozuvi rad etildi`);
    }
    const amount = totalAmount - tax; // revenue net of VAT
    const lines: JournalLine[] = [
      { accountCode: GL.ACCOUNTS_RECEIVABLE_TRADE, accountName: 'Debitorlar (AR)', debit: totalAmount, credit: 0 },
      { accountCode: GL.REVENUE,                   accountName: 'Tushum (Revenue)', debit: 0, credit: amount },
      { accountCode: GL.SALES_TAX_PAYABLE,         accountName: 'QQS (Sales Tax Payable)', debit: 0, credit: tax },
      { accountCode: GL.COGS,                      accountName: 'Tannarx (COGS) - Dr', debit: costOfGoods, credit: 0 },
      { accountCode: GL.INVENTORY,                 accountName: 'Materiallar (Inventory) - Cr', debit: 0, credit: costOfGoods },
    ];
    return this.createJournalEntry(lines, `DC-${orderId}`);
  }

  private async createJournalEntry(lines: JournalLine[], reference: string, createdBy?: number): Promise<Result<number>> {
    // H1 idempotency: if this business reference (e.g. SI-123, PR-7) was already posted, return the
    // existing entry id WITHOUT inserting again. Covers every caller (invoice/payroll/GR/VP/MC + the
    // finance-gl admin endpoints) at the source — closes the double-post window between post + status-flip.
    const already = await this.glPostingRepo.findEntryIdByReference(reference);
    if (already.ok && already.data) {
      this.logger.debug(`Journal already posted for ${reference} (idempotent) — entry id=${already.data}`);
      return Ok(already.data);
    }

    const safeLines = Array.isArray(lines) ? lines : [];
    const debits = safeLines.filter((l) => l.debit > 0).map((l) => ({ code: l.accountCode, name: l.accountName, amt: l.debit }));
    const credits = safeLines.filter((l) => l.credit > 0).map((l) => ({ code: l.accountCode, name: l.accountName, amt: l.credit }));
    const totalDebit  = debits.reduce((s, d) => s + d.amt, 0);
    const totalCredit = credits.reduce((s, c) => s + c.amt, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return Err(`Double-entry validation failed: Debit ${totalDebit} != Credit ${totalCredit}`);
    }

    // F2 data-quality gate (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): a balanced-but-zero journal (every
    // line 0) passes the check above and used to fall through to insertJournal([]) — a silent no-op that
    // returns Ok() while writing nothing. This is the exact root cause traced in
    // GL-GARBAGE-ROW-ARCHIVE-2026-07-06.md's "F2/F3 residual risk" note. Enforced centrally here so every
    // caller (current and future) is covered, not just the ones with their own per-method guard.
    if (!(totalDebit > 0)) {
      return Err(
        `EP-FIN-DATA-QUALITY: jurnal umumiy summasi 0 yoki manfiy (reference=${reference}) — ` +
          `bo'sh/soxta GL yozuvi rad etildi`,
      );
    }

    // C3 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): was `new Date().toISOString().slice(0,10)` —
    // .toISOString() is always UTC. Tashkent is UTC+5, so any post between 00:00-05:00 Tashkent
    // time landed on the PREVIOUS calendar day (e.g. a 02:00 Tashkent post got entry_date =
    // yesterday), silently mis-dating GL entries and — worse — letting a post that should have
    // been rejected by the period-lock below slip into an already-closed period one day early.
    // TashkentTimeService.formatDate() correctly resolves the calendar day in Asia/Tashkent.
    const entryDate = _time.formatDate(new Date());

    // EP-FIN-064 PERIOD LOCK: a new GL post whose entry_date falls inside a CLOSED accounting period
    // is rejected here at the ONE engine — so every caller (invoice/payroll/GR/VP/MC + the finance-gl
    // admin endpoints) is covered at the source. The period must be open (or no period defined) to post.
    // (The idempotency short-circuit above means an already-posted reference is unaffected — only a
    // genuinely-new entry into a locked period is blocked.) FinanceAccountingService surfaces this Err
    // as a 400 BadRequest. An open/absent period → posting proceeds normally.
    const lock = await this.glPostingRepo.findClosedPeriodForDate(entryDate);
    if (!lock.ok) return Err(lock.error);
    if (lock.data) {
      this.logger.warn(`Period lock: ${reference} rejected — entry date ${entryDate} is in closed period ${lock.data.periodCode}`);
      return Err(
        `Davr yopilgan (EP-FIN-064): ${entryDate} sanasi yopilgan hisob davriga (${lock.data.periodCode}) ` +
          `tegishli — yangi GL yozuvi taqiqlanadi. Yozuvni ochiq davrga kiriting yoki davrni qayta oching.`,
      );
    }

    // #04 fix: the live `entries` row is a BALANCED PAIR (debit_account_id + credit_account_id both set
    // to a real account) — like postMovementToLedger. The old code wrote one row per leg with 'OFFSET'
    // for the missing side, which crashed against the integer account columns. Decompose the multi-leg
    // journal into balanced (debit, credit, amount) rows by greedily allocating debits against credits.
    const rows: Array<{ entryNumber: string; entryDate: string; documentType: string; debitAccountId: string; creditAccountId: string; amount: number; description: string; createdBy?: number }> = [];
    let di = 0, ci = 0, dRem = debits[0]?.amt ?? 0, cRem = credits[0]?.amt ?? 0, guard = 0;
    while (di < debits.length && ci < credits.length && guard++ < 1000) {
      const alloc = Math.min(dRem, cRem);
      rows.push({
        entryNumber: `${reference}-${Date.now()}-${rows.length}`,
        entryDate,
        documentType: 'journal',
        debitAccountId: debits[di].code,
        creditAccountId: credits[ci].code,
        amount: Math.round(alloc * 100) / 100,
        description: `${reference} — ${debits[di].name} / ${credits[ci].name}`,
        createdBy,
      });
      dRem -= alloc; cRem -= alloc;
      if (dRem <= 0.001) { di++; dRem = debits[di]?.amt ?? 0; }
      if (cRem <= 0.001) { ci++; cRem = credits[ci]?.amt ?? 0; }
    }

    const result = await this.glPostingRepo.insertJournal(rows);
    if (result.ok) {
      this.logger.debug(`Journal entry created - Reference: ${reference}, Debit/Credit: ${totalDebit}`);
    }
    return result;
  }
}
