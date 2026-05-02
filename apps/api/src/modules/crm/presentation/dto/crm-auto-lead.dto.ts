import { z } from 'zod';

import { MAX_SHORT_TEXT } from '@common/constants/app.constants';

export const IngestCallLeadDtoSchema = z.object({
  phone: z.string().min(7).max(20).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  notes: z.string().max(MAX_SHORT_TEXT).optional(),
  source_meta: z.record(z.string(), z.unknown()).optional(),
}).passthrough();
export type IngestCallLeadDto = z.infer<typeof IngestCallLeadDtoSchema>;

export const IngestFormLeadDtoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  form_name: z.string().min(1).max(200).optional(),
  notes: z.string().max(MAX_SHORT_TEXT).optional(),
}).passthrough();
export type IngestFormLeadDto = z.infer<typeof IngestFormLeadDtoSchema>;

export const IngestTelegramLeadDtoSchema = z.object({
  telegram_id: z.union([z.string(), z.number()]).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  username: z.string().min(1).max(100).optional(),
  message: z.string().max(MAX_SHORT_TEXT).optional(),
}).passthrough();
export type IngestTelegramLeadDto = z.infer<typeof IngestTelegramLeadDtoSchema>;

export const IngestWebsiteLeadDtoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  page_url: z.string().max(2048).optional(),
  message: z.string().max(MAX_SHORT_TEXT).optional(),
}).passthrough();
export type IngestWebsiteLeadDto = z.infer<typeof IngestWebsiteLeadDtoSchema>;

export const ChurnRescueDtoSchema = z.record(z.string(), z.unknown());
export type ChurnRescueDto = z.infer<typeof ChurnRescueDtoSchema>;
