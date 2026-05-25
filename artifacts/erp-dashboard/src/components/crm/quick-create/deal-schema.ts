/**
 * @module deal-schema
 * @description React UI component.
 */

import { z } from "zod";

import { tLabel } from '@/lib/i18n/tLabel';
export const CURRENCIES = [
  { value: "UZS", label: tLabel('common.deal-schema.uzsSom', "UZS (so'm)") },
  { value: "USD", label: "USD ($)" },
];

export const dealFormSchema = z.object({
  title: z.string().min(1, "Bitim nomi majburiy"),
  opportunity: z.coerce.number().min(0, "Summa 0 dan katta bo'lishi kerak"),
  currencyId: z.string().default("UZS"),
  closeDate: z.string().optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  companyId: z.coerce.number().optional(),
  contactId: z.coerce.number().optional(),
  assignedById: z.string().optional(),
  comments: z.string().optional(),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;
