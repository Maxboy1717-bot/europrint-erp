/**
 * @module lead-schema
 * @description React UI component.
 */

import { z } from "zod";

import { tLabel } from '@/lib/i18n/tLabel';
export const LEAD_SOURCES = [
  { value: "WEBFORM",  label: "🌐 Web forma" },
  { value: "TELEGRAM", label: "✈️ Telegram" },
  { value: "CALL",     label: tLabel('common.lead-schema.qongiroq', "📞 Qo'ng'iroq") },
  { value: "EMAIL",    label: "📧 Email" },
  { value: "WEB",      label: "💻 Sayt" },
  { value: "INBOUND",  label: "📥 Kiruvchi" },
  { value: "referral", label: "🤝 Referral" },
  { value: "reklama",  label: "📢 Reklama" },
  { value: "other",    label: "🔧 Boshqa" },
];

export const LEAD_PRIORITIES = [
  { value: "low",    label: "🟢 Past" },
  { value: "normal", label: tLabel('common.lead-schema.orta', "🔵 O'rta") },
  { value: "high",   label: "🟠 Yuqori" },
  { value: "urgent", label: "🔴 Shoshilinch" },
];

export const leadFormSchema = z.object({
  title:             z.string().min(1, "Lid nomi majburiy"),
  name:              z.string().optional(),
  lastName:          z.string().optional(),
  phone:             z.string().optional(),
  email:             z.string().email("Email formati noto'g'ri").optional().or(z.literal("")),
  companyTitle:      z.string().optional(),
  source:            z.string().optional(),
  sourceDescription: z.string().optional(),
  priority:          z.string().optional(),
  budget:            z.coerce.number().min(0).optional(),
  opportunityAmount: z.coerce.number().min(0).optional(),
  comments:          z.string().optional(),
  assignedById:      z.string().optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
