/**
 * @module campaign.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

import { MAX_DESCRIPTION_LENGTH } from '@common/constants/app.constants';
export const CreateCampaignDtoSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().min(0).max(MAX_DESCRIPTION_LENGTH).optional(),
  type: z.enum(['email', 'sms', 'social', 'telegram', 'promotion']),
  budget: z.number().positive().optional(),
  startDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  targetAudience: z.object({
    region: z.string().optional(),
    ageGroup: z.string().optional(),
    interests: z.array(z.string()).optional(),
  }).optional(),
});

export type CreateCampaignDto = z.infer<typeof CreateCampaignDtoSchema>;

export const UpdateCampaignDtoSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  description: z.string().min(0).max(MAX_DESCRIPTION_LENGTH).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
  budget: z.number().positive().optional(),
  startDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  targetAudience: z.object({
    region: z.string().optional(),
    ageGroup: z.string().optional(),
    interests: z.array(z.string()).optional(),
  }).optional(),
});

export type UpdateCampaignDto = z.infer<typeof UpdateCampaignDtoSchema>;
