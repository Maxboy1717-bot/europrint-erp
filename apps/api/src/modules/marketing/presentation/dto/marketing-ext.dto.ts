/**
 * @module marketing-ext.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

import { MAX_SHORT_TEXT, MAX_NAME_LENGTH, ONE_KB, MAX_LONG_TEXT } from '@common/constants/app.constants';
export const CreateContentPostDtoSchema = z.object({
  title:    z.string().min(1).max(MAX_SHORT_TEXT),
  content:  z.string().max(ONE_KB * 50).optional(),
  postType: z.enum(['blog', 'news', 'announcement', 'social']).default('blog'),
  tags:     z.string().max(MAX_SHORT_TEXT).optional(),
  category: z.string().max(MAX_NAME_LENGTH).optional(),
});
export type CreateContentPostDto = z.infer<typeof CreateContentPostDtoSchema>;

export const UpdateContentPostDtoSchema = z.object({
  title:    z.string().min(1).max(MAX_SHORT_TEXT).optional(),
  content:  z.string().max(ONE_KB * 50).optional(),
  postType: z.enum(['blog', 'news', 'announcement', 'social']).optional(),
  tags:     z.string().max(MAX_SHORT_TEXT).optional(),
  category: z.string().max(MAX_NAME_LENGTH).optional(),
});
export type UpdateContentPostDto = z.infer<typeof UpdateContentPostDtoSchema>;

export const CreateSocialAccountDtoSchema = z.object({
  platform:    z.enum(['instagram', 'facebook', 'telegram', 'twitter', 'linkedin', 'youtube']),
  accountName: z.string().min(1).max(MAX_NAME_LENGTH),
  accountId:   z.string().max(MAX_NAME_LENGTH).optional(),
});
export type CreateSocialAccountDto = z.infer<typeof CreateSocialAccountDtoSchema>;

export const CreateSocialPostDtoSchema = z.object({
  content:   z.string().min(1).max(MAX_LONG_TEXT),
  platform:  z.enum(['instagram', 'facebook', 'telegram', 'twitter', 'linkedin', 'youtube']),
  accountId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});
export type CreateSocialPostDto = z.infer<typeof CreateSocialPostDtoSchema>;

export const UpdateSocialPostDtoSchema = z.object({
  content:   z.string().min(1).max(MAX_LONG_TEXT).optional(),
  status:    z.enum(['draft', 'scheduled', 'posted', 'failed']).optional(),
  scheduledAt: z.string().datetime().optional(),
});
export type UpdateSocialPostDto = z.infer<typeof UpdateSocialPostDtoSchema>;

export const CreateEmailTemplateDtoSchema = z.object({
  name:         z.string().min(1).max(MAX_NAME_LENGTH),
  subject:      z.string().min(1).max(MAX_SHORT_TEXT),
  body:         z.string().min(1),
  templateType: z.enum(['newsletter', 'transactional', 'promotional', 'announcement']).default('newsletter'),
});
export type CreateEmailTemplateDto = z.infer<typeof CreateEmailTemplateDtoSchema>;

export const UpdateEmailTemplateDtoSchema = z.object({
  name:         z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  subject:      z.string().min(1).max(MAX_SHORT_TEXT).optional(),
  body:         z.string().min(1).optional(),
  templateType: z.enum(['newsletter', 'transactional', 'promotional', 'announcement']).optional(),
  isActive:     z.boolean().optional(),
});
export type UpdateEmailTemplateDto = z.infer<typeof UpdateEmailTemplateDtoSchema>;

export const UpdateLeadStatusDtoSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
});
export type UpdateLeadStatusDto = z.infer<typeof UpdateLeadStatusDtoSchema>;
