/**
 * @module mm-query.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { IntegerIdSchema } from '@common/dto/integer-id.zod';

export const GetPurchaseOrdersDtoSchema = z.object({
  status: z.enum([
    'draft',
    'pending',
    'approved',
    'partially_received',
    'received',
    'invoiced',
    'paid',
    'cancelled',
  ]).optional(),
  vendorId: IntegerIdSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetPurchaseOrdersDto = z.infer<typeof GetPurchaseOrdersDtoSchema>;

export const GetVendorsDtoSchema = z.object({
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetVendorsDto = z.infer<typeof GetVendorsDtoSchema>;
