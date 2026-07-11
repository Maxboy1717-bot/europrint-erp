/**
 * @module i-sd-invoices.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
import type { DrizzleExecutor } from '../../../common/types/drizzle.types';
export type { DrizzleExecutor };

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
  /** Master-reja 3.5 "eksport-invoys (Incoterms)" — ixtiyoriy (EP-SD-070). */
  deliveryTerm?: string | null;
  incotermCode?: string | null;
  currency?: string | null;
  /** VISION-3340 SD-06 #24 — 'full' | 'partial' | null; CreateInvoiceHandler hisoblaydi. */
  invoiceType?: string | null;
}

/**
 * Result of comparing what was ORDERED (`sales_order_items.order_quantity`) against what has
 * actually been DELIVERED so far (`delivery_items.delivery_quantity`, via `deliveries`).
 * `hasDeliveryData` is true only when at least one `delivery_items` row exists for the order —
 * this distinguishes "nothing shipped yet" (unknown — the table is empty in the build phase)
 * from "confirmed 0 delivered", so callers never fabricate a 'partial'/'full' verdict out of an
 * empty table (Q-40).
 */
export interface OrderFulfillmentQty {
  orderedQty: number;
  deliveredQty: number;
  hasDeliveryData: boolean;
}

export interface InvoiceRow {
  invoiceNumber: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  status: string;
}

export interface ISdInvoicesRepository {
  /**
   * Loads only the fields needed for invoice-creation guards (status, soft-delete).
   * Pass `tx` to participate in an outer transaction.
   */
  findOrderForInvoicing(
    orderId: string,
    tx?: DrizzleExecutor,
  ): Promise<Result<OrderForInvoice | null>>;

  /**
   * Inserts a row into the canonical `invoices` table and returns the projected summary.
   * Pass `tx` to participate in an outer transaction.
   */
  createInvoice(input: CreateInvoiceInput, tx?: DrizzleExecutor): Promise<Result<InvoiceRow>>;

  /**
   * Sums the order's ordered line quantities against what has actually left the warehouse for
   * it, to stamp `invoices.invoice_type` ('full' | 'partial') at invoice-creation time
   * (VISION-3340 SD-06 #24). See {@link OrderFulfillmentQty} for the no-fabrication contract.
   * Pass `tx` to participate in an outer transaction.
   */
  getOrderFulfillmentQty(
    salesOrderId: string,
    tx?: DrizzleExecutor,
  ): Promise<Result<OrderFulfillmentQty>>;

  /**
   * Runs the supplied work inside a Drizzle transaction. Lets callers keep the
   * transaction boundary inside the repo layer (handlers don't need `db`).
   */
  withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>>;
}
export const SD_INVOICES_REPO = 'ISdInvoicesRepository';
