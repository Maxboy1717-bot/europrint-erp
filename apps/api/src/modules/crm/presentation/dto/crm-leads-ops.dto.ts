import { z } from 'zod';

import { MAX_SHORT_TEXT } from '@common/constants/app.constants';

export const UpdateLeadDtoSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  notes: z.string().max(MAX_SHORT_TEXT).optional(),
}).passthrough();
export type UpdateLeadDto = z.infer<typeof UpdateLeadDtoSchema>;

export const UpdateLeadStageDtoSchema = z.object({
  stage_id: z.number().int().positive(),
  notes: z.string().max(MAX_SHORT_TEXT).optional(),
});
export type UpdateLeadStageDto = z.infer<typeof UpdateLeadStageDtoSchema>;

export const ConvertLeadDtoSchema = z.object({
  deal_name: z.string().min(1).max(500).optional(),
  expected_amount: z.number().nonnegative().optional(),
});
export type ConvertLeadDto = z.infer<typeof ConvertLeadDtoSchema>;
