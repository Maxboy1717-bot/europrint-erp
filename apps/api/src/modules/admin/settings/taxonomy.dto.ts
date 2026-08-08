/**
 * @module taxonomy.dto
 * @description §2 Taksonomiya CRUD Zod sxemalari (Qoida 3).
 */
import { z } from 'zod';

export const ListTaxonomyQuerySchema = z.object({
  includeInactive: z.coerce.boolean().default(false),
});
export type ListTaxonomyQueryDto = z.infer<typeof ListTaxonomyQuerySchema>;

export const CreateTaxonomySchema = z.object({
  category: z.string().min(1).max(60).regex(/^[a-z0-9_]+$/, 'kategoriya faqat a-z 0-9 _'),
  code: z.string().min(1).max(60).regex(/^[a-z0-9_-]+$/i, 'kod faqat harf/raqam/_/-'),
  nameUz: z.string().min(1).max(200),
  nameRu: z.string().max(200).optional().nullable(),
  sortOrder: z.number().int().optional(),
  // Konvensiya: category='operation_type' uchun attrs.duration_minutes (number|null) — norm-vaqt
  // daqiqada, egasi keyinroq shu CRUD orqali to'ldiradi (owner decision 2026-07-13). Boshqa
  // kategoriyalar o'z attrs maydonlaridan erkin foydalanishi mumkin — umumiy jsonb bucket.
  attrs: z.record(z.unknown()).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});
export type CreateTaxonomyDto = z.infer<typeof CreateTaxonomySchema>;

export const UpdateTaxonomySchema = z.object({
  nameUz: z.string().min(1).max(200).optional(),
  nameRu: z.string().max(200).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  // Konvensiya: category='operation_type' uchun attrs.duration_minutes (number|null) — norm-vaqt.
  attrs: z.record(z.unknown()).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
}).refine((v) => Object.keys(v).length > 0, { message: 'Kamida bitta maydon kerak' });
export type UpdateTaxonomyDto = z.infer<typeof UpdateTaxonomySchema>;
