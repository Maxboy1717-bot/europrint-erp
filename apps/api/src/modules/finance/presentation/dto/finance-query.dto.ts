/**
 * @module finance-query.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const GetInvoicesDtoSchema = z.object({
  status: z.enum(['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled']).optional(),
  customerId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export const GetPaymentsDtoSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export const GetGlEntriesDtoSchema = z.object({
  account: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export type GetInvoicesDto = z.infer<typeof GetInvoicesDtoSchema>;
export type GetPaymentsDto = z.infer<typeof GetPaymentsDtoSchema>;
export type GetGlEntriesDto = z.infer<typeof GetGlEntriesDtoSchema>;
