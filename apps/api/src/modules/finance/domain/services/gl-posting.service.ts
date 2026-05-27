/**
 * @module gl-posting.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { GL } from "../constants/gl-accounts.constants";
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
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

  async postPayroll(payrollId: number, gross: number, inps: number, jshd: number): Promise<Result<number>> {
    this.logger.debug(`Posting Payroll - ID: ${payrollId}, Gross: ${gross}, INPS: ${inps}, JSHD: ${jshd}`);
    const lines: JournalLine[] = [
      { accountCode: GL.SALARY_EXPENSE, accountName: 'Salary Expense', debit: gross, credit: 0 },
      { accountCode: GL.EMPLOYER_CONTRIBUTION, accountName: 'Employer Contribution', debit: inps, credit: 0 },
      { accountCode: GL.SALARY_PAYABLE, accountName: 'Salary Payable', debit: 0, credit: gross - inps - jshd },
      { accountCode: GL.EMPLOYEE_DEDUCTIONS, accountName: 'Employee Deductions', debit: 0, credit: inps + jshd },
    ];
    const result = await this.createJournalEntry(lines, `PR-${payrollId}`);
    if (result.ok) this.logger.log(`Payroll posted - Entry ID: ${result.data}`);
    return result;
  }

  private async createJournalEntry(lines: JournalLine[], reference: string): Promise<Result<number>> {
    const safeLines = Array.isArray(lines) ? lines : [];
    const totalDebit  = safeLines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = safeLines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return Err(`Double-entry validation failed: Debit ${totalDebit} != Credit ${totalCredit}`);
    }

    const entryDate = new Date().toISOString().slice(0, 10);
    let firstId: number | undefined;

    for (const line of safeLines) {
      const amount = line.debit > 0 ? line.debit : line.credit;
      if (amount <= 0) continue;

      const entryNumber = `${reference}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const insertResult = await this.glPostingRepo.insertEntry({
        entryNumber,
        entryDate,
        documentType: 'journal',
        debitAccountId:  line.debit  > 0 ? line.accountCode : 'OFFSET',
        creditAccountId: line.credit > 0 ? line.accountCode : 'OFFSET',
        amount,
        description: `${reference} — ${line.accountName}`,
      });

      if (!insertResult.ok) {
        return Err(AppErr('DB_ERROR', `Failed to insert GL line for ${line.accountName}: ${insertResult.error.message}`));
      }
      if (firstId === undefined) firstId = insertResult.data;
    }

    this.logger.debug(`Journal entry created - Reference: ${reference}, Debit/Credit: ${totalDebit}`);
    return Ok(firstId ?? 0);
  }
}
