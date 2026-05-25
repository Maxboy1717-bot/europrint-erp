/**
 * @module SDQuotationsTypes
 * @description Shared TypeScript types, Zod schemas, and helper utilities for
 * the SDQuotations feature.
 */

import { z } from "zod";
import type {
  SdQuotation as Quotation,
  SdQuotationItem as QuotationItem,
} from "@shared/schema";

// Re-export shared schema types so consumers can import from one place
export type { Quotation, QuotationItem };
export type { InsertSdQuotation as InsertQuotation } from "@shared/schema";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

export const quotationFormSchema = z.object({
  quotationNumber: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().min(1, "Mijoz nomi talab qilinadi"),
  quotationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired", "converted"]),
  currency: z.string().default("UZS"),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  netValue: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative(),
  totalValue: z.coerce.number().nonnegative(),
});

export type QuotationFormData = z.infer<typeof quotationFormSchema>;

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface QuotationWithItems extends Quotation {
  items?: QuotationItem[];
  createdByName?: string;
}

export interface QuotationLineItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export const generateQuotationNumber = (): string => {
  const ts = Date.now().toString().slice(-8);
  const suffix = ts.slice(-3).toUpperCase();
  return `QT-${ts.slice(0, 5)}-${suffix}`;
};
