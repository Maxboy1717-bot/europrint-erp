/**
 * @module ai-crm.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const AiCrmChurnRiskDtoSchema = z.object({
  activityData: z.record(z.string(), z.unknown()),
});
export type AiCrmChurnRiskDto = z.infer<typeof AiCrmChurnRiskDtoSchema>;

export const AiCrmEmailTemplateDtoSchema = z.object({
  purpose: z.enum(['FOLLOW_UP', 'PROPOSAL', 'RE_ENGAGE', 'THANK_YOU']),
  contactName: z.string().min(1).max(100),
  context: z.string().min(1).max(2000),
});
export type AiCrmEmailTemplateDto = z.infer<typeof AiCrmEmailTemplateDtoSchema>;

export const AiCrmNextBestActionDtoSchema = z.object({
  lastActivities: z.array(z.string()).min(0).max(50),
});
export type AiCrmNextBestActionDto = z.infer<typeof AiCrmNextBestActionDtoSchema>;
