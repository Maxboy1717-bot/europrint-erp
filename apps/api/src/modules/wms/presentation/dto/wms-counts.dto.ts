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

// ── W3-COUNT — inventarizatsiya kuchaytirish DTO'lari ────────────────────────

// Count-line yozish: system≠counted bo'lsa deviation_reason_code MAJBURIY (service tekshiradi).
export const WmsCountLineSchema = z.object({
  count_id:               z.union([z.string().min(1), z.number().int().positive()]),
  material_id:            z.union([z.string().min(1), z.number().int().positive()]),
  system_qty:             z.union([z.string(), z.number()]),
  counted_qty:            z.union([z.string(), z.number()]),
  deviation_reason_code:  z.string().min(1).max(64).optional(),
  notes:                  z.string().optional(),
}).passthrough();
export type WmsCountLineDto = z.infer<typeof WmsCountLineSchema>;

// Zona/material muzlatish.
export const WmsFreezeZoneSchema = z.object({
  warehouse_id: z.union([z.string().min(1), z.number().int().positive()]),
  material_id:  z.union([z.string(), z.number().int().positive()]).optional(),
  count_id:     z.union([z.string(), z.number().int().positive()]).optional(),
  reason:       z.string().optional(),
}).passthrough();
export type WmsFreezeZoneDto = z.infer<typeof WmsFreezeZoneSchema>;
