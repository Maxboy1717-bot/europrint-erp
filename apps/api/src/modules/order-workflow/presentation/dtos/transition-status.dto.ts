import { z } from 'zod';
import { ORDER_STATUSES } from '../../domain/value-objects/order-status.vo';

export const TransitionStatusDtoSchema = z.object({
  toStatus: z.enum(ORDER_STATUSES),
  reason:   z.string().max(500).optional(),
});

export type TransitionStatusDto = z.infer<typeof TransitionStatusDtoSchema>;
