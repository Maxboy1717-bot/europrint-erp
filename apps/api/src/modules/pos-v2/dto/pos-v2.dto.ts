/**
 * @module pos-v2.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const PosV2BarcodeLookupSchema = z.object({
  barcode: z.string().min(2).max(100),
  type:    z.enum(['ean13', 'qr', 'code128', 'auto']).optional(),
});
export type PosV2BarcodeLookupDto = z.infer<typeof PosV2BarcodeLookupSchema>;

export const PosV2UpdateInventoryLineSchema = z.object({
  counted_quantity: z.number().int().min(0),
  notes:            z.string().optional(),
});
export type PosV2UpdateInventoryLineDto = z.infer<typeof PosV2UpdateInventoryLineSchema>;

export const PosV2CompleteInventoryCountSchema = z.object({
  notes: z.string().optional(),
});
export type PosV2CompleteInventoryCountDto = z.infer<typeof PosV2CompleteInventoryCountSchema>;

export const PosV2ApproveInventoryCountSchema = z.object({
  syncStock: z.boolean().optional(),
  notes:     z.string().optional(),
});
export type PosV2ApproveInventoryCountDto = z.infer<typeof PosV2ApproveInventoryCountSchema>;

export const PosV2CreateRequestSchema = z.object({
  material_id:  z.number().int().positive(),
  quantity:     z.number().positive(),
  reason:       z.string().optional(),
  priority:     z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});
export type PosV2CreateRequestDto = z.infer<typeof PosV2CreateRequestSchema>;

export const PosV2UpdateRequestStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'fulfilled', 'cancelled']),
  notes:  z.string().optional(),
});
export type PosV2UpdateRequestStatusDto = z.infer<typeof PosV2UpdateRequestStatusSchema>;
