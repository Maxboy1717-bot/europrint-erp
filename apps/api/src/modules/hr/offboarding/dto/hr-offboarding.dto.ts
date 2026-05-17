import { z } from 'zod';

export const HrOffboardingCreateSchema = z.object({
  employee_id:      z.number().int().positive(),
  dismissal_type:   z.enum(['voluntary', 'termination', 'retirement', 'end_of_contract', 'mutual']).optional(),
  last_working_day: z.string().optional(),
});
export type HrOffboardingCreateDto = z.infer<typeof HrOffboardingCreateSchema>;

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

export const HrOffboardingCancelSchema = z.object({
  reason: z.string().max(500).optional(),
});
export type HrOffboardingCancelDto = z.infer<typeof HrOffboardingCancelSchema>;

export const HrOffboardingListQuerySchema = z.object({
  status:      z.enum(['active', 'exit_interviewed', 'completed', 'cancelled']).optional(),
  employee_id: z.coerce.number().int().positive().optional(),
});
export type HrOffboardingListQueryDto = z.infer<typeof HrOffboardingListQuerySchema>;
