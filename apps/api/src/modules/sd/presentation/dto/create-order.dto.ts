import { z } from 'zod';

export const CreateOrderDtoSchema = z.object({
  companyId: z.number().int().positive('Company ID must be positive'),
  totalAmount: z.number().positive('Total amount must be positive'),
  currency: z.string().length(3).toUpperCase().default('USD'),
  designFlag: z.boolean().default(false),
  sampleFlag: z.boolean().default(false),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>;
