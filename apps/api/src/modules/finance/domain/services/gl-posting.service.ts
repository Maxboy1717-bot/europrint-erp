/**
 * @module gl-posting.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { GL } from "../constants/gl-accounts.constants";
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result, Err } from '@common/result';
import { IGlPostingRepository, GL_POSTING_REPO } from '../repositories/i-gl-posting.repo';

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

  async postSalesInvoice(invoiceId: number, amount: number, tax: number): Promise<Result<number>> {
    this.logger.debug(`Posting Sales Invoice - ID: ${invoiceId}, Amount: ${amount}, Tax: ${tax}`);
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

  private async createJournalEntry(lines: JournalLine[], reference: string): Promise<Result<number>> {
    const safeLines = Array.isArray(lines) ? lines : [];
    const debits = safeLines.filter((l) => l.debit > 0).map((l) => ({ code: l.accountCode, name: l.accountName, amt: l.debit }));
    const credits = safeLines.filter((l) => l.credit > 0).map((l) => ({ code: l.accountCode, name: l.accountName, amt: l.credit }));
    const totalDebit  = debits.reduce((s, d) => s + d.amt, 0);
    const totalCredit = credits.reduce((s, c) => s + c.amt, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return Err(`Double-entry validation failed: Debit ${totalDebit} != Credit ${totalCredit}`);
    }

    const entryDate = new Date().toISOString().slice(0, 10);

    // #04 fix: the live `entries` row is a BALANCED PAIR (debit_account_id + credit_account_id both set
    // to a real account) — like postMovementToLedger. The old code wrote one row per leg with 'OFFSET'
    // for the missing side, which crashed against the integer account columns. Decompose the multi-leg
    // journal into balanced (debit, credit, amount) rows by greedily allocating debits against credits.
    const rows: Array<{ entryNumber: string; entryDate: string; documentType: string; debitAccountId: string; creditAccountId: string; amount: number; description: string }> = [];
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
