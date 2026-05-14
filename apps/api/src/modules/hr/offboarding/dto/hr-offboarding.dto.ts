/**
 * @module hr-offboarding.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const HrOffboardingUpdateChecklistSchema = z.object({
  completed: z.boolean(),
  notes:     z.string().optional(),
});
export type HrOffboardingUpdateChecklistDto = z.infer<typeof HrOffboardingUpdateChecklistSchema>;

export const HrOffboardingExitInterviewSchema = z.object({
  rating:           z.number().int().min(1).max(10).optional(),
  would_return:     z.boolean().optional(),
  main_reason:      z.string().max(500).optional(),
  feedback:         z.string().optional(),
  improvements:     z.string().optional(),
});
export type HrOffboardingExitInterviewDto = z.infer<typeof HrOffboardingExitInterviewSchema>;

export const HrOffboardingFinalizeSchema = z.object({
  last_working_day: z.string().optional(),
  notes:            z.string().optional(),
});
export type HrOffboardingFinalizeDto = z.infer<typeof HrOffboardingFinalizeSchema>;
