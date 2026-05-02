import { z } from 'zod';

export const SendEmailDtoSchema = z.object({
  to: z.string().email('Noto\'g\'ri email format'),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50_000),
  lead_id: z.number().int().positive().optional(),
  deal_id: z.number().int().positive().optional(),
});
export type SendEmailDto = z.infer<typeof SendEmailDtoSchema>;

export const ScheduleMeetingDtoSchema = z.object({
  title: z.string().min(1).max(500),
  lead_id: z.number().int().positive().optional(),
  deal_id: z.number().int().positive().optional(),
  scheduled_at: z.string().optional(),
  attendees: z.array(z.unknown()).optional(),
});
export type ScheduleMeetingDto = z.infer<typeof ScheduleMeetingDtoSchema>;

export const SendSmsDtoSchema = z.object({
  phone: z.string().min(7).max(20),
  message: z.string().min(1).max(2000),
  lead_id: z.number().int().positive().optional(),
});
export type SendSmsDto = z.infer<typeof SendSmsDtoSchema>;

export const SendWhatsappDtoSchema = z.object({
  phone: z.string().min(7).max(20),
  message: z.string().min(1).max(4096),
  lead_id: z.number().int().positive().optional(),
});
export type SendWhatsappDto = z.infer<typeof SendWhatsappDtoSchema>;
