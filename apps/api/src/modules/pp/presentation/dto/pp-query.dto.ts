/**
 * @module pp-query.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { IntegerIdSchema } from '@common/dto/integer-id.zod';

export const GetProductionOrdersDtoSchema = z.object({
  status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'on_hold', 'cancelled']).optional(),
  salesOrderId: IntegerIdSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export const GetBomsDtoSchema = z.object({
  isActive: z.boolean().optional(),
  productName: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export const GetRoutingsDtoSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export const GetMrpReportDtoSchema = z.object({
  productionOrderId: IntegerIdSchema.optional(),
});

export type GetProductionOrdersDto = z.infer<typeof GetProductionOrdersDtoSchema>;
export type GetBomsDto = z.infer<typeof GetBomsDtoSchema>;
export type GetRoutingsDto = z.infer<typeof GetRoutingsDtoSchema>;
export type GetMrpReportDto = z.infer<typeof GetMrpReportDtoSchema>;
