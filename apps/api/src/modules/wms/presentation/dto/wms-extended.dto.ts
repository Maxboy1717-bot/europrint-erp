/**
 * @module wms-extended.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

// Zod schema bilan validatsiya qilinadi — class-validator ishlatilmaydi
import { z } from 'zod';
import { MAX_SHORT_TEXT } from '@common/constants/app.constants';

export const UpdateWarehouseDtoSchema = z.object({
  name:            z.string().max(255).optional(),
  address:         z.string().max(500).optional(),
  isFreeStorage:   z.boolean().optional(),
  freeStorageDays: z.number().int().positive().optional(),
  monthlyRate:     z.number().optional(),
});
export type UpdateWarehouseDto = z.infer<typeof UpdateWarehouseDtoSchema>;

export const CreateWarehouseDtoSchema = z.object({
  name:            z.string().min(2).max(255),
  address:         z.string().min(5).max(MAX_SHORT_TEXT),
  isFreeStorage:   z.boolean().optional(),
  freeStorageDays: z.number().int().positive().default(30),
  monthlyRate:     z.number().positive().nullable().optional(),
});
export type CreateWarehouseDto = z.infer<typeof CreateWarehouseDtoSchema>;

export const GetInventoryDtoSchema = z.object({
  category: z.string().optional(),
  location: z.string().optional(),
  lowStock: z.boolean().optional(),
  page:     z.number().int().positive().optional(),
  limit:    z.number().int().positive().optional(),
});
export type GetInventoryDto = z.infer<typeof GetInventoryDtoSchema>;

export const GetLowStockDtoSchema = z.object({
  threshold: z.number().int().positive().default(10),
});
export type GetLowStockDto = z.infer<typeof GetLowStockDtoSchema>;
