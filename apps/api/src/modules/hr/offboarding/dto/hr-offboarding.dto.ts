/**
 * @module hr-offboarding.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

// P1.18.1: accept both camelCase (FE) and snake_case for backward compat
const _dismissalEnum = z.enum(['voluntary', 'termination', 'retirement', 'end_of_contract', 'mutual', 'resignation']);
export const HrOffboardingCreateSchema = z.object({
  employee_id:      z.number().int().positive().optional(),
  employeeId:       z.number().int().positive().optional(),
  dismissal_type:   _dismissalEnum.optional(),
  dismissalType:    _dismissalEnum.optional(),
  last_working_day: z.string().optional(),
  lastWorkingDay:   z.string().optional(),
}).passthrough().transform((d) => ({
  employee_id:      d.employee_id ?? d.employeeId,
  dismissal_type:   d.dismissal_type ?? d.dismissalType,
  last_working_day: d.last_working_day ?? d.lastWorkingDay,
})).refine(d => d.employee_id != null && d.employee_id > 0, {
  message: 'employee_id / employeeId talab qilinadi',
  path: ['employee_id'],
});
export type HrOffboardingCreateDto = { employee_id: number; dismissal_type?: string; last_working_day?: string };

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
