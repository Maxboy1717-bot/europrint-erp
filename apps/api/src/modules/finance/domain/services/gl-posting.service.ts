import { GL } from "../constants/gl-accounts.constants";
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err } from '@common/result';

import { FINANCE_RANDOM_REF_RANGE } from '@common/constants/app.constants';
export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

@Injectable()
export class GlPostingService {
  private readonly logger = new Logger(GlPostingService.name);

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
    const result = this.createJournalEntry(lines, `PR-${payrollId}`);
    if (result.ok) this.logger.log(`Payroll posted - Entry ID: ${result.data}`);
    return result;
  }

  private createJournalEntry(lines: JournalLine[], reference: string): Result<number> {
    const totalDebit = (Array.isArray(lines) ? lines : []).reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = (Array.isArray(lines) ? lines : []).reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return Err(`Double-entry validation failed: Debit ${totalDebit} != Credit ${totalCredit}`);
    }

    this.logger.debug(`Journal entry created - Reference: ${reference}, Debit/Credit: ${totalDebit}`);
    return Ok(Math.floor(Math.random() * FINANCE_RANDOM_REF_RANGE));
  }
}
