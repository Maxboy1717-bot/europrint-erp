import { z } from 'zod';

const DUE_TYPES = ['ADVANCE', 'MILESTONE', 'NET_30', 'ON_DELIVERY'] as const;

const entrySchema = z.object({
  sequence:     z.number().int().positive(),
  dueType:      z.enum(DUE_TYPES),
  percent:      z.number().min(0).max(100),
  amount:       z.number().min(0).optional(),
  dueCondition: z.record(z.unknown()).optional(),
});

export const PaymentPlanDtoSchema = z.object({
  entries: z.array(entrySchema).min(1).max(10),
});

export type PaymentPlanDto = z.infer<typeof PaymentPlanDtoSchema>;
