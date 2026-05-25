/**
 * @module mes-query.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const GetSessionsDtoSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'paused', 'completed', 'failed']).optional(),
  operatorId: z.string().uuid().optional(),
  productionOrderId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export const GetOeeDtoSchema = z.object({
  workCenterId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type GetSessionsDto = z.infer<typeof GetSessionsDtoSchema>;
export type GetOeeDto = z.infer<typeof GetOeeDtoSchema>;
