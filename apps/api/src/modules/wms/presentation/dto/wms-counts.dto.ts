/**
 * @module wms-counts.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

// Zod schema bilan validatsiya qilinadi — class-validator ishlatilmaydi
import { z } from 'zod';

export const WmsCreateInventoryCountSchema = z.object({
  warehouse_id: z.union([z.string().min(1), z.number().int().positive()]),
  counted_by:   z.union([z.string(), z.number().int().positive()]).optional(),
  notes:        z.string().optional(),
}).passthrough();
export type WmsCreateInventoryCountDto = z.infer<typeof WmsCreateInventoryCountSchema>;

export const WmsCreateInternalRequestSchema = z.object({
  material_id:      z.union([z.string().min(1), z.number().int().positive()]),
  quantity:         z.union([z.string().min(1), z.number().positive()]),
  from_warehouse_id: z.union([z.string(), z.number().int().positive()]).optional(),
  to_warehouse_id:  z.union([z.string(), z.number().int().positive()]).optional(),
  notes:            z.string().optional(),
}).passthrough();
export type WmsCreateInternalRequestDto = z.infer<typeof WmsCreateInternalRequestSchema>;

export const WmsUpdateInternalRequestSchema = z.object({
  status: z.string().optional(),
  notes:  z.string().optional(),
}).passthrough();
export type WmsUpdateInternalRequestDto = z.infer<typeof WmsUpdateInternalRequestSchema>;
