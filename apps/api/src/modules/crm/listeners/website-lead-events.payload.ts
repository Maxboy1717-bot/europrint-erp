/**
 * @module website-lead-events.payload
 * @description Source module. See exports for details.
 */

import { z } from 'zod';
import { LEAD_SUB_SOURCE } from '@common/constants/lead-sources.constants';

/**
 * Trigger 21 — Saytdan buyurtma kelganda yuboriladigan event payload.
 * EcommerceService.createPublicOrderFromBody dan emit qilinadi.
 */
export const WebsiteOrderEventSchema = z.object({
  orderId: z.number().int().positive(),
  orderNumber: z.string().min(1),
  customerName: z.string().min(1).max(200).optional().nullable(),
  customerPhone: z.string().min(3).max(30),
  customerEmail: z.string().email().optional().nullable(),
  totalAmount: z.number().nonnegative(),
  itemsCount: z.number().int().nonnegative(),
  deliveryCity: z.string().max(100).optional().nullable(),
  paymentMethod: z.string().max(30).optional().nullable(),
  subSource: z
    .enum([LEAD_SUB_SOURCE.WEBSITE_ORDER, LEAD_SUB_SOURCE.WEBSITE_FORM])
    .default(LEAD_SUB_SOURCE.WEBSITE_ORDER),
  occurredAt: z.string().datetime(),
});

export type WebsiteOrderEvent = z.infer<typeof WebsiteOrderEventSchema>;

/**
 * Trigger 22 — Saytda aloqa formasi yuborilganda.
 */
export const WebsiteContactEventSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(3).max(30),
  email: z.string().email().optional().nullable(),
  message: z.string().max(5_000).optional().nullable(),
  channel: z.enum(['contact_form', 'chatbot']).default('contact_form'),
  occurredAt: z.string().datetime(),
});

export type WebsiteContactEvent = z.infer<typeof WebsiteContactEventSchema>;
