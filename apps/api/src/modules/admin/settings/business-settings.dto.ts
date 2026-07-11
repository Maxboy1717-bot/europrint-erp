/**
 * @module business-settings.dto
 * @description Zod validatsiya sxemalari (Qoida 3) — global biznes-sozlamalar CRUD uchun.
 */
import { z } from 'zod';

export const VALUE_TYPES = ['number', 'percent', 'days', 'minutes', 'amount', 'text', 'boolean'] as const;

export const ListBusinessSettingsQuerySchema = z.object({
  module: z.string().min(1).max(40).optional(),
  includeInactive: z.coerce.boolean().default(false),
});
export type ListBusinessSettingsQueryDto = z.infer<typeof ListBusinessSettingsQuerySchema>;

export const CreateBusinessSettingSchema = z.object({
  module: z.string().min(1).max(40),
  settingKey: z.string().min(1).max(120).regex(/^[a-z0-9_.]+$/, 'kalit faqat a-z 0-9 _ . belgilaridan'),
  label: z.string().min(1).max(200),
  valueType: z.enum(VALUE_TYPES),
  valueNum: z.number().optional().nullable(),
  valueText: z.string().max(2000).optional().nullable(),
  unit: z.string().max(30).optional().nullable(),
  minVal: z.number().optional().nullable(),
  maxVal: z.number().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});
export type CreateBusinessSettingDto = z.infer<typeof CreateBusinessSettingSchema>;

export const UpdateBusinessSettingSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  valueNum: z.number().optional().nullable(),
  valueText: z.string().max(2000).optional().nullable(),
  unit: z.string().max(30).optional().nullable(),
  minVal: z.number().optional().nullable(),
  maxVal: z.number().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'Kamida bitta maydon kerak' });
export type UpdateBusinessSettingDto = z.infer<typeof UpdateBusinessSettingSchema>;
