import { z } from 'zod';

export const PosAddProductSchema = z.object({
  product_id:  z.number().int().positive().optional(),
  name:        z.string().min(1).max(255).optional(),
  price:       z.number().positive().optional(),
  quantity:    z.number().int().positive().optional(),
  barcode:     z.string().optional(),
}).passthrough();
export type PosAddProductDto = z.infer<typeof PosAddProductSchema>;

export const PosCreateTransactionSchema = z.object({
  items:          z.array(z.object({
    product_id: z.number().int().positive(),
    quantity:   z.number().int().positive(),
    price:      z.number().positive().optional(),
  })).min(1),
  payment_method: z.enum(['cash', 'card', 'bank_transfer']).optional(),
  total_amount:   z.number().positive().optional(),
}).passthrough();
export type PosCreateTransactionDto = z.infer<typeof PosCreateTransactionSchema>;
