/**
 * @module create-order.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

// One order line — EITHER binds to a finished-good product (owner 2026-06-05) OR, when
// productId is omitted, describes a bespoke print job by physical spec (owner decision
// 2026-07-13, chat — "Mahsulot vs Buyurtma zanjiri"). Mirrors the same optional-productId +
// custom-spec-column shape already added to sales_order_items for the quotation-conversion
// paths (approveQuotation()/convertQuotationToOrder()) — this is the same contract, now also
// reachable from the canonical manual create-order flow (e.g. the /order-create wizard).
export const OrderLineItemSchema = z.object({
  productId: z.number().int().positive('Product ID must be positive').optional(),
  description: z.string().min(1).max(500),
  orderQuantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1).max(10).default('PC'),
  netPrice: z.number().nonnegative('Price must be >= 0'),
  productType: z.string().max(100).optional(),
  paperType: z.string().max(100).optional(),
  thicknessMm: z.number().nonnegative().optional(),
  lengthMm: z.number().nonnegative().optional(),
  widthMm: z.number().nonnegative().optional(),
  heightMm: z.number().nonnegative().optional(),
  printColors: z.number().int().nonnegative().optional(),
  lamination: z.boolean().optional(),
  perforation: z.boolean().optional(),
  specialCoating: z.boolean().optional(),
  isNewDie: z.boolean().optional(),
  printingMethod: z.string().max(100).optional(),
  machineFormat: z.string().max(100).optional(),
});

export const CreateOrderDtoSchema = z.object({
  companyId: z.number().int().positive('Company ID must be positive'),
  // #03 golden-thread HOP-0: the customer link (was dropped → orders had customer_id=NULL).
  customerId: z.number().int().positive('Customer ID must be positive').optional(),
  // 2.6 golden-thread: the originating CRM lead (crm_leads.id), when the manual
  // order-entry form is opened from a CRM lead context. Optional — undefined for
  // orders created without a lead origin (no fabrication).
  crmLeadId: z.number().int().positive('CRM lead ID must be positive').optional(),
  totalAmount: z.number().positive('Total amount must be positive'),
  currency: z.string().length(3).toUpperCase().default('USD'),
  designFlag: z.boolean().default(false),
  sampleFlag: z.boolean().default(false),
  items: z.array(OrderLineItemSchema).optional().default([]),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>;
