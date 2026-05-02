import { z } from 'zod';

import { MAX_SHORT_TEXT } from '@common/constants/app.constants';

export const CheckCompanyDuplicatesDtoSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  inn: z.string().min(1).max(20).optional(),
}).refine((d) => d.name !== undefined || d.inn !== undefined, {
  message: 'name yoki inn kamida bittasi majburiy',
});
export type CheckCompanyDuplicatesDto = z.infer<typeof CheckCompanyDuplicatesDtoSchema>;

export const CreateCompanyDtoSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  inn: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(MAX_SHORT_TEXT).optional(),
}).passthrough();
export type CreateCompanyDto = z.infer<typeof CreateCompanyDtoSchema>;

export const UpdateCompanyDtoSchema = CreateCompanyDtoSchema;
export type UpdateCompanyDto = z.infer<typeof UpdateCompanyDtoSchema>;

export const UpdateCreditLimitDtoSchema = z.object({
  credit_limit: z.number().nonnegative(),
});
export type UpdateCreditLimitDto = z.infer<typeof UpdateCreditLimitDtoSchema>;

export const CreateLeadStageDtoSchema = z.object({
  name: z.string().min(1).max(200),
  color: z.string().max(20).optional(),
  sort_order: z.number().int().nonnegative().optional(),
});
export type CreateLeadStageDto = z.infer<typeof CreateLeadStageDtoSchema>;

export const UpdateLeadStageDtoSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  color: z.string().max(20).optional(),
  sort_order: z.number().int().nonnegative().optional(),
}).passthrough();
export type UpdateLeadStageDto = z.infer<typeof UpdateLeadStageDtoSchema>;
