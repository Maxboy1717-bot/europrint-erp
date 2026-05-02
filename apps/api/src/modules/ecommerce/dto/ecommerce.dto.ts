import { z } from 'zod';

export const EcommerceCreateOrderSchema = z.object({
  customer_id: z.coerce.number().int().positive().optional(),
  items: z.array(z.object({
    product_id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
    price: z.coerce.number().positive().optional(),
  })).optional(),
  total_amount: z.coerce.number().positive().optional(),
  payment_method: z.string().optional(),
  delivery_address: z.string().optional(),
  notes: z.string().optional(),
}).passthrough();
export type EcommerceCreateOrderDto = z.infer<typeof EcommerceCreateOrderSchema>;

export const EcommerceUpdateOrderStatusSchema = z.object({
  status: z.string().min(1),
  notes: z.string().optional(),
}).passthrough();
export type EcommerceUpdateOrderStatusDto = z.infer<typeof EcommerceUpdateOrderStatusSchema>;

export const EcommerceBodySchema = EcommerceCreateOrderSchema;
export type EcommerceBodyDto = z.infer<typeof EcommerceBodySchema>;

/**
 * Public contact form (Trigger 22 manbasi).
 */
export const PublicContactSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(3).max(30),
  email: z.string().email().optional().nullable(),
  message: z.string().max(5_000).optional().nullable(),
  channel: z.enum(['contact_form', 'chatbot']).default('contact_form'),
});
export type PublicContactDto = z.infer<typeof PublicContactSchema>;
