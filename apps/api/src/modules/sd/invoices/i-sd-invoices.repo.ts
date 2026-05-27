/**
 * @module i-sd-invoices.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
import type { DrizzleExecutor } from '../../../common/types/drizzle.types';
export type { DrizzleExecutor };
type Row = Record<string, unknown>;

export interface OrderForInvoice {
  id: string;
  status: string;
  deletedAt: Date | null;
}

export interface CreateInvoiceInput {
  invoiceNumber: string;
  salesOrderId: string | null;
  customerName: string;
  customerId?: string | null;
  itemsJson: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  paidAmount: string;
  status: string;
  dueDate: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceRow {
  invoiceNumber: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  status: string;
}

export interface ISdInvoicesRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Result<any | null>>;
  create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>>;

  /**
   * Loads only the fields needed for invoice-creation guards (status, soft-delete).
   * Pass `tx` to participate in an outer transaction.
   */
  findOrderForInvoicing(
    orderId: string,
    tx?: DrizzleExecutor,
  ): Promise<Result<OrderForInvoice | null>>;

  /**
   * Inserts a row into the legacy `invoices` table and returns the projected summary.
   * Pass `tx` to participate in an outer transaction.
   */
  createInvoice(input: CreateInvoiceInput, tx?: DrizzleExecutor): Promise<Result<InvoiceRow>>;

  /**
   * Runs the supplied work inside a Drizzle transaction. Lets callers keep the
   * transaction boundary inside the repo layer (handlers don't need `db`).
   */
  withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>>;
}
export const SD_INVOICES_REPO = 'ISdInvoicesRepository';
