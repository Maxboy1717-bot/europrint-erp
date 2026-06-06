/**
 * @module create-order.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

// One order line — binds to a finished-good product (owner 2026-06-05).
export const OrderLineItemSchema = z.object({
  productId: z.number().int().positive('Product ID must be positive'),
  description: z.string().min(1).max(500),
  orderQuantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1).max(10).default('PC'),
  netPrice: z.number().nonnegative('Price must be >= 0'),
});

export const CreateOrderDtoSchema = z.object({
  companyId: z.number().int().positive('Company ID must be positive'),
  totalAmount: z.number().positive('Total amount must be positive'),
  currency: z.string().length(3).toUpperCase().default('USD'),
  designFlag: z.boolean().default(false),
  sampleFlag: z.boolean().default(false),
  items: z.array(OrderLineItemSchema).optional().default([]),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>;
