/**
 * @module mm-vendor-invoice.dto
 * @description Zod DTO schemas for the MM vendor-invoice money endpoints
 *   (approve / 2-way match / 3-way match / payment). Qoida 3: every `@Body()`
 *   is validated by a Zod schema before it reaches the service layer.
 * @layer Presentation (MM)
 */

import { z } from 'zod';

/** PATCH /mm/vendor-invoices/:id/approve — body is optional context only. */
export const MmApproveVendorInvoiceSchema = z.object({
  notes: z.string().max(1000).optional(),
});
export type MmApproveVendorInvoiceDto = z.infer<typeof MmApproveVendorInvoiceSchema>;

/**
 * PATCH /mm/vendor-invoices/:id/match — 2-way match (PO ↔ invoice).
 * `tolerance` is the shape LogisticsDashboard.tsx:97 already sends (`{ tolerance: 5 }`,
 * i.e. PERCENT 0..100). When omitted the tolerance comes from business_settings
 * (`mm.three_way_amount_tolerance_pct`) — never hardcoded.
 */
export const MmMatchVendorInvoiceSchema = z.object({
  tolerance: z.number().min(0).max(100).optional(),
  tolerance_pct: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
});
export type MmMatchVendorInvoiceDto = z.infer<typeof MmMatchVendorInvoiceSchema>;

/**
 * POST /mm/3way-match/:invoiceId — 3-way match (PO ↔ goods receipt ↔ invoice).
 * All tolerances are PERCENT (0..100) when supplied by the caller; defaults are read
 * from business_settings as ratios (0.05 = 5%).
 */
export const MmThreeWayMatchSchema = z.object({
  qty_tolerance_pct: z.number().min(0).max(100).optional(),
  amount_tolerance_pct: z.number().min(0).max(100).optional(),
  /** parity with the integration module's payload name */
  tolerancePercent: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
});
export type MmThreeWayMatchDto = z.infer<typeof MmThreeWayMatchSchema>;

/**
 * POST /mm/vendor-invoices/:id/payment — record an outgoing payment against a
 * vendor invoice. Money endpoint: amount is strictly positive and the payment
 * method is a closed set.
 */
export const MmVendorInvoicePaymentSchema = z.object({
  amount: z.number().positive({ message: "To'lov summasi musbat bo'lishi kerak" }),
  payment_method: z.enum(['bank_transfer', 'cash', 'card', 'offset', 'other']),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "payment_date formati YYYY-MM-DD bo'lishi kerak" })
    .optional(),
  currency: z.string().min(3).max(8).optional(),
  exchange_rate: z.number().positive().optional(),
  /** Bank/kassa hujjat raqami — takroriy to'lovni bloklash uchun ishlatiladi (idempotentlik). */
  reference: z.string().max(200).optional(),
  bank_account: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});
export type MmVendorInvoicePaymentDto = z.infer<typeof MmVendorInvoicePaymentSchema>;
