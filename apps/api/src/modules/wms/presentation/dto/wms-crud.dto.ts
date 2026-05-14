/**
 * @module wms-crud.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

// Zod schema bilan validatsiya qilinadi — class-validator ishlatilmaydi
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const PatchTransactionSchema = z.object({
  quantity:  z.number().optional(),
  unit_cost: z.number().optional(),
  notes:     z.string().max(500).optional(),
});
export class PatchTransactionDto extends createZodDto(PatchTransactionSchema) {}

export const PatchGoodsIssueSchema = z.object({
  quantity: z.number().positive().optional(),
  notes:    z.string().max(500).optional(),
});
export class PatchGoodsIssueDto extends createZodDto(PatchGoodsIssueSchema) {}

export const PatchInventorySchema = z.object({
  qty_on_hand: z.number().optional(),
  notes:       z.string().max(500).optional(),
});
export class PatchInventoryDto extends createZodDto(PatchInventorySchema) {}

export const PatchRentalSchema = z.object({
  area_m2:             z.number().positive().optional(),
  daily_rate_per_m2:   z.number().positive().optional(),
  notes:               z.string().max(500).optional(),
  status:              z.enum(['active', 'closed', 'pending']).optional(),
});
export class PatchRentalDto extends createZodDto(PatchRentalSchema) {}

export const PatchStockSchema = z.object({
  qty:      z.number().optional(),
  batch_no: z.string().max(100).optional(),
  notes:    z.string().max(500).optional(),
});
export class PatchStockDto extends createZodDto(PatchStockSchema) {}
