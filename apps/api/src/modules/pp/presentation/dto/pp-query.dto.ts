import { z } from 'zod';

export const GetProductionOrdersDtoSchema = z.object({
  status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'on_hold', 'cancelled']).optional(),
  salesOrderId: z.string().uuid().optional(),
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
  productionOrderId: z.string().uuid().optional(),
});

export type GetProductionOrdersDto = z.infer<typeof GetProductionOrdersDtoSchema>;
export type GetBomsDto = z.infer<typeof GetBomsDtoSchema>;
export type GetRoutingsDto = z.infer<typeof GetRoutingsDtoSchema>;
export type GetMrpReportDto = z.infer<typeof GetMrpReportDtoSchema>;
