import { z } from "zod";

export const LEAD_SOURCES = [
  { value: "telegram", label: "Telegram" },
  { value: "phone", label: "Telefon" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "reklama", label: "Reklama" },
  { value: "other", label: "Boshqa" },
];

export const leadFormSchema = z.object({
  title: z.string().min(1, "Lid nomi majburiy"),
  name: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email formati noto'g'ri").optional().or(z.literal("")),
  companyTitle: z.string().optional(),
  source: z.string().optional(),
  sourceDescription: z.string().optional(),
  budget: z.coerce.number().min(0).optional(),
  opportunityAmount: z.coerce.number().min(0).optional(),
  comments: z.string().optional(),
  assignedById: z.string().optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
