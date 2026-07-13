/**
 * @module hr-offboarding.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

// P1.18.1: accept both camelCase (FE) and snake_case for backward compat
// 2026-07-13 (HR Offboarding page fix): union of the original HR-classification
// values AND the labels the CreateCaseDialog dropdown (HROffboardingTypes.ts
// DISMISSAL_MAP) actually sends — `contract_end`/`relocation`/`other` were
// missing, so picking those options in the live UI always 400'd.
const _dismissalEnum = z.enum([
  'voluntary', 'termination', 'retirement', 'end_of_contract', 'mutual', 'resignation',
  'contract_end', 'relocation', 'other',
]);
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

// 2026-07-13 (HR Offboarding page fix): the live UI (HROffboardingSteps.tsx /
// employee-profile OffboardingTab.tsx) PATCHes `{ done, notes }` — `completed`
// was required and never sent, so every "Bajarildi" click 400'd. Accept both
// spellings; `returnStatus` (OffboardingTab's equipment-return select) is
// accepted and forwarded through (return_status column).
export const HrOffboardingUpdateChecklistSchema = z.object({
  completed:    z.boolean().optional(),
  done:         z.boolean().optional(),
  notes:        z.string().optional(),
  returnStatus: z.string().optional(),
}).transform((d) => ({
  completed:    d.completed ?? d.done ?? false,
  notes:        d.notes,
  returnStatus: d.returnStatus,
}));
export type HrOffboardingUpdateChecklistDto = z.infer<typeof HrOffboardingUpdateChecklistSchema>;

// 2026-07-13 (HR Offboarding page fix — exit interview made optional per
// vision): the live UI posts `{ answers: { reason_for_leaving, management_rating,
// environment_rating, would_recommend } }` (HROffboardingInterview.tsx /
// OffboardingTabDialogs.tsx EXIT_QUESTIONS), not the old flat
// rating/would_return/main_reason shape. Accept both; also accept an explicit
// `skipped: true` (no-response fallback — vision: exit interview is OPTIONAL,
// "javob bermadi" is a valid turnover category when HR skips it entirely).
export const HrOffboardingExitInterviewSchema = z.object({
  // Legacy flat shape (kept for back-compat / API callers).
  rating:           z.number().int().min(1).max(10).optional(),
  would_return:     z.boolean().optional(),
  main_reason:      z.string().max(500).optional(),
  feedback:         z.string().optional(),
  improvements:     z.string().optional(),
  // Live UI shape.
  answers:          z.record(z.string(), z.string()).optional(),
  // Explicit skip ("javob bermadi" / did-not-respond).
  skipped:          z.boolean().optional(),
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
  status:      z.enum(['active', 'exit_interviewed', 'completed', 'cancelled']).optional().or(z.literal('')),
  employee_id: z.coerce.number().int().positive().optional(),
  // HROffboarding.tsx sends `search=` (employee name filter) on every request.
  search:      z.string().optional(),
}).transform(d => ({
  status:      d.status || undefined,
  employee_id: d.employee_id,
  search:      d.search || undefined,
}));
export type HrOffboardingListQueryDto = z.infer<typeof HrOffboardingListQuerySchema>;
