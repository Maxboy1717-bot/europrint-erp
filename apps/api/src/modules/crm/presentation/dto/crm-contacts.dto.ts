/**
 * @module crm-contacts.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

import { MAX_SHORT_TEXT } from '@common/constants/app.constants';

export const CheckContactDuplicatesDtoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
}).refine((d) => d.email !== undefined || d.phone !== undefined, {
  message: 'email yoki phone kamida bittasi majburiy',
});
export type CheckContactDuplicatesDto = z.infer<typeof CheckContactDuplicatesDtoSchema>;

export const CreateContactDtoSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  company_id: z.number().int().positive().optional(),
  notes: z.string().max(MAX_SHORT_TEXT).optional(),
}).passthrough();
export type CreateContactDto = z.infer<typeof CreateContactDtoSchema>;

export const UpdateContactDtoSchema = CreateContactDtoSchema;
export type UpdateContactDto = z.infer<typeof UpdateContactDtoSchema>;
