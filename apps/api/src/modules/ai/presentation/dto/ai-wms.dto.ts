/**
 * @module ai-wms.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const AiWmsReorderPointDtoSchema = z.object({
  itemName: z.string().min(1).max(500),
  currentStock: z.number().nonnegative(),
  avgDailyUsage: z.number().nonnegative(),
  leadTimeDays: z.number().int().positive(),
  historicalUsage: z.array(z.number().nonnegative()).max(365),
});
export type AiWmsReorderPointDto = z.infer<typeof AiWmsReorderPointDtoSchema>;

export const AiWmsOptimizeStockDtoSchema = z.object({
  inventorySnapshot: z.array(z.record(z.string(), z.unknown())).max(10_000),
});
export type AiWmsOptimizeStockDto = z.infer<typeof AiWmsOptimizeStockDtoSchema>;

export const AiWmsDeliveryPredictDtoSchema = z.object({
  origin: z.string().min(1).max(500),
  destination: z.string().min(1).max(500),
  itemType: z.string().min(1).max(200),
  orderDate: z.string().min(1),
  historicalDeliveries: z.array(z.record(z.string(), z.unknown())).max(1000),
});
export type AiWmsDeliveryPredictDto = z.infer<typeof AiWmsDeliveryPredictDtoSchema>;

export const AiWmsRouteOptimizeDtoSchema = z.object({
  deliveries: z.array(z.unknown()).max(500),
  startLocation: z.string().min(1).max(500),
});
export type AiWmsRouteOptimizeDto = z.infer<typeof AiWmsRouteOptimizeDtoSchema>;
