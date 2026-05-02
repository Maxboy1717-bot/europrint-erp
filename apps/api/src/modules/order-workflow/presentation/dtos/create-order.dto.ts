import { z } from 'zod';

export const CreateOrderDtoSchema = z.object({
  customerId:           z.number().int().positive().nullable().optional().default(null),
  totalAmount:          z.number().nonnegative().default(0),
  currency:             z.enum(['UZS', 'USD', 'EUR']).default('UZS'),
  assignedSalesManager: z.number().int().positive().nullable().optional().default(null),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>;
