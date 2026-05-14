/**
 * @module sd-quotations.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const SdCreateQuotationSchema = z.object({
  customer_id:    z.coerce.number().int().positive().optional(),
  valid_until:    z.string().optional(),
  discount:       z.coerce.number().min(0).max(100).optional(),
  payment_terms:  z.string().optional(),
  notes:          z.string().optional(),
  items:          z.array(z.object({
    product_id: z.coerce.number().int().positive(),
    quantity:   z.coerce.number().positive(),
    price:      z.coerce.number().positive().optional(),
  })).optional(),
}).passthrough();
export type SdCreateQuotationDto = z.infer<typeof SdCreateQuotationSchema>;

export const SdCreateContractSchema = z.object({
  customer_id:   z.coerce.number().int().positive().optional(),
  start_date:    z.string().optional(),
  end_date:      z.string().optional(),
  total_amount:  z.coerce.number().positive().optional(),
  payment_terms: z.string().optional(),
  notes:         z.string().optional(),
}).passthrough();
export type SdCreateContractDto = z.infer<typeof SdCreateContractSchema>;

export const SdCalculatePriceSchema = z.object({
  product_id: z.union([z.string().min(1), z.number().int().positive()]),
  quantity:   z.union([z.string().min(1), z.number().positive()]),
  formula_id: z.union([z.string(), z.number().int().positive()]).optional(),
});
export type SdCalculatePriceDto = z.infer<typeof SdCalculatePriceSchema>;
