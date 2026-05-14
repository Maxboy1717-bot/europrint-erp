/**
 * @module erp.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const ErpUpdateOrderSchema = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
  production_date: z.string().optional(),
}).passthrough();
export type ErpUpdateOrderDto = z.infer<typeof ErpUpdateOrderSchema>;

export const ErpUpdateWorkCenterSchema = z.object({
  name: z.string().max(255).optional(),
  capacity: z.coerce.number().positive().optional(),
  status: z.string().optional(),
}).passthrough();
export type ErpUpdateWorkCenterDto = z.infer<typeof ErpUpdateWorkCenterSchema>;

export const ErpCreateMrpRunSchema = z.object({
  horizon_days: z.coerce.number().int().positive().optional(),
  warehouse_id: z.coerce.number().int().positive().optional(),
  run_date: z.string().optional(),
}).passthrough();
export type ErpCreateMrpRunDto = z.infer<typeof ErpCreateMrpRunSchema>;

export const ErpBodySchema = ErpUpdateOrderSchema;
export type ErpBodyDto = z.infer<typeof ErpBodySchema>;
