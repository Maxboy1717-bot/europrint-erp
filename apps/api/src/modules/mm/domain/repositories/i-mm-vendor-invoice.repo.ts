/**
 * @module i-mm-vendor-invoice.repo
 * @description Domain repository interface for the MM vendor-invoice money flows
 *   (material supplier list, invoice approve, 2-way / 3-way match, payment).
 *   Concrete implementation:
 *   `infrastructure/repositories/mm-vendor-invoice.repository.ts`.
 * @layer Domain (MM)
 */

import type { Result } from '@common/result';

export type Row = Record<string, unknown>;

/**
 * Everything the match / approve / payment rules need about one vendor invoice,
 * already joined against its purchase order and goods receipt.
 * All numeric fields are pre-coerced to `number` by the repository.
 */
export interface VendorInvoiceMatchBasis {
  invoiceId: number;
  invoiceNumber: string;
  vendorId: number | null;
  createdBy: number | null;
  status: string;
  matchStatus: string;
  currency: string;
  poId: number | null;
  grId: number | null;
  invoiceAmount: number;
  invoiceQty: number;
  /** null = no purchase order linked to this invoice */
  poAmount: number | null;
  poQty: number;
  /** null = no goods receipt linked to this invoice */
  grAmount: number | null;
  grQty: number;
  paidAmount: number;
}

/** Values written back onto `vendor_invoices` after a match run. */
export interface MatchOutcomeWrite {
  matchStatus: string;
  matchScore: number;
  priceVariance: number;
  quantityVariance: number;
}

/** One row of the `three_way_match_results` audit trail. */
export interface ThreeWayMatchWrite {
  invoiceId: number;
  poId: number | null;
  grId: number | null;
  poAmount: number | null;
  grAmount: number | null;
  invoiceAmount: number;
  priceVariancePercent: number;
  quantityVariancePercent: number;
  overallStatus: string;
  tolerancePercent: number;
  autoApproved: boolean;
  matchedBy: number | null;
  notes: string | null;
  matchDetails: Record<string, unknown>;
}

/** One recorded outgoing payment against a vendor invoice. */
export interface VendorInvoicePaymentWrite {
  invoiceId: number;
  vendorId: number | null;
  paymentDate: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  exchangeRate: number | null;
  reference: string | null;
  bankAccount: string | null;
  notes: string | null;
  createdBy: number | null;
}

/**
 * Status vocabulary + threshold the SERVICE decided on; the repository only
 * applies it atomically inside the payment transaction (business words stay in
 * the application layer, Qoida 6).
 */
export interface PaymentStatusRule {
  /** Invoice is considered fully settled once total paid reaches this amount. */
  fullyPaidAtOrAbove: number;
  statusWhenFullyPaid: string;
  statusWhenPartial: string;
}

export interface RecordedPayment {
  payment: Row;
  paidTotal: number;
  invoiceStatus: string;
}

export interface IMmVendorInvoiceRepo {
  /** Suppliers that have delivered — or price-list — a given material. */
  findMaterialSuppliers(materialId: number): Promise<Result<Row[]>>;
  /** Does this material exist at all? Drives 404 vs empty-list. */
  materialExists(materialId: number): Promise<Result<boolean>>;

  /** Invoice + PO + GR figures needed by every money rule. null = invoice missing. */
  getMatchBasis(invoiceId: number): Promise<Result<VendorInvoiceMatchBasis | null>>;

  /** Status-guarded approve. null = invoice was no longer in an approvable status. */
  approveInvoice(invoiceId: number, userId: number, notes: string | null): Promise<Result<Row | null>>;

  /** Persist the match verdict onto vendor_invoices (+ purchase_orders flags). */
  saveMatchOutcome(invoiceId: number, outcome: MatchOutcomeWrite, threeWay: boolean): Promise<Result<Row | null>>;

  /** Append one row to the three_way_match_results audit trail. */
  insertThreeWayMatchResult(data: ThreeWayMatchWrite): Promise<Result<Row>>;

  /**
   * Atomic money write: reference-idempotency check + payment number + INSERT +
   * recomputed paid total + invoice status, all inside one transaction.
   * Returns a CONFLICT error when `reference` was already recorded for this invoice.
   */
  recordPayment(data: VendorInvoicePaymentWrite, rule: PaymentStatusRule): Promise<Result<RecordedPayment>>;
}

export const MM_VENDOR_INVOICE_REPO = Symbol('MM_VENDOR_INVOICE_REPO');
