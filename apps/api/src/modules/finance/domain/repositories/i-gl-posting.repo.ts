/**
 * @module i-gl-posting.repo
 * @description Domain repository interface for GL journal entry insertion.
 * @layer Domain (Finance)
 */

import type { Result } from '@common/result';

export interface IGlPostingRepository {
  insertEntry(data: {
    entryNumber: string;
    entryDate: string;
    documentType: string;
    documentId?: string;
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    description?: string;
    createdBy?: number;
  }): Promise<Result<number>>;

  /** Atomic multi-leg journal insert — all legs commit together or none (rolls back on any failure). */
  insertJournal(rows: Array<{
    entryNumber: string;
    entryDate: string;
    documentType: string;
    documentId?: string;
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    description?: string;
    createdBy?: number;
  }>): Promise<Result<number>>;

  /**
   * Idempotency lookup: the first entries.id already posted for a business reference (entry_number
   * prefix `${reference}-%`), or null if none. Lets the engine skip a duplicate post for the same event.
   */
  findEntryIdByReference(reference: string): Promise<Result<number | null>>;

  /**
   * EP-FIN-064 period lock: return the CLOSED accounting period whose [start_date, end_date]
   * range contains the given entry date (YYYY-MM-DD), or null if the date is in an open period
   * (or no period covers it at all). The engine rejects a journal post when this returns a period.
   */
  findClosedPeriodForDate(entryDate: string): Promise<Result<{ id: number; periodCode: string } | null>>;

  /**
   * F2 data-quality gate (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): does a `finance_invoices` row with
   * this id exist? postSalesInvoice rejects the posting when it doesn't — a GL entry must always trace
   * to a real source document.
   */
  financeInvoiceExists(invoiceId: number): Promise<Result<boolean>>;

  /**
   * F2 data-quality gate: does a `sales_orders` row with this id exist? postDeliveryCompleted rejects
   * the posting when it doesn't, for the same reason as financeInvoiceExists.
   */
  salesOrderExists(orderId: number): Promise<Result<boolean>>;
}

export const GL_POSTING_REPO = Symbol('IGlPostingRepository');
