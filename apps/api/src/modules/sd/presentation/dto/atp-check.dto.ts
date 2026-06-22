/**
 * @module atp-check.dto
 * @description DTO + Zod schema for the SD order-entry ATP (Available-To-Promise) check.
 *
 * Vision source: EP-PP-066 / EP-PP-024 / CHAT-TARIXI line 25 —
 * "Savdo buyurtma yaratishda taxminiy muddat + bor/yo'q real vaqtda ko'radi" /
 * "Buyurtma kiritishda avtomatik xom-ashyo tekshiruvi (ATP); yetmasa qizil + taxminiy sana".
 *
 * This is the NON-AI part of the planning vision: a deterministic availability check
 * from real stock + per-material lead time. No AI key, no owner-gated coefficient.
 *
 * Two entry modes:
 *   1. Preview at order entry — caller posts `items` (material + quantity) BEFORE saving.
 *   2. Existing order — caller posts `orderId`; lines are read from sales_order_items.
 */

import { z } from 'zod';

/** One demand line for the ATP check (material card id + quantity). */
export const AtpLineSchema = z.object({
  materialId: z.number().int().positive('Material ID must be positive'),
  quantity: z.number().positive('Quantity must be positive'),
});

export const AtpCheckDtoSchema = z
  .object({
    /** Existing saved order — its lines are read from sales_order_items. */
    orderId: z.number().int().positive('Order ID must be positive').optional(),
    /** Inline preview lines (used at order entry, before the order is saved). */
    items: z.array(AtpLineSchema).max(200, 'Too many lines').optional(),
  })
  .refine((d) => d.orderId !== undefined || (Array.isArray(d.items) && d.items.length > 0), {
    message: 'Either orderId or a non-empty items array is required',
  });

export type AtpCheckDto = z.infer<typeof AtpCheckDtoSchema>;
export type AtpLine = z.infer<typeof AtpLineSchema>;
