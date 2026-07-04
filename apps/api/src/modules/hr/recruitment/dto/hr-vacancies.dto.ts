/**
 * @module hr-vacancies.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const HrUpdateChannelStatusSchema = z.object({
  channel: z.string().min(1).max(100),
  active:  z.boolean(),
});
export type HrUpdateChannelStatusDto = z.infer<typeof HrUpdateChannelStatusSchema>;

export const HrVacancyChannelStatusUpdateSchema = z.object({
  channel: z.string().min(1).max(100),
  status:  z.string().optional(),
});
export type HrVacancyChannelStatusUpdateDto = z.infer<typeof HrVacancyChannelStatusUpdateSchema>;

export const HrUpdatePipelineStageSchema = z.object({
  stage:   z.string().min(1).max(100),
  notes:   z.string().optional(),
  date:    z.string().optional(),
});
export type HrUpdatePipelineStageDto = z.infer<typeof HrUpdatePipelineStageSchema>;

// Q13-follow-up (2026-07-04): .passthrough() added -- the real FE caller
// (ProbationReviewDialog.tsx) sends review_type/scores/observations/decision/
// reviewer_name/employee_name/position_name/mentor_name/review_date, none of
// which existed on this schema, so every real submission was silently
// stripped down to {} before reaching the controller.
export const HrProbationReviewSchema = z.object({
  result:  z.enum(['pass', 'fail', 'extend']).optional(),
  rating:  z.number().int().min(1).max(10).optional(),
  notes:   z.string().optional(),
}).passthrough();
export type HrProbationReviewDto = z.infer<typeof HrProbationReviewSchema>;

export const HrNdaRequestSchema = z.object({
  signatory_id: z.number().int().positive().optional(),
  notes:        z.string().optional(),
});
export type HrNdaRequestDto = z.infer<typeof HrNdaRequestSchema>;

export const HrMakeOfferSchema = z.object({
  salary:     z.number().positive().optional(),
  start_date: z.string().optional(),
  notes:      z.string().optional(),
  currency:   z.string().max(10).optional(),
});
export type HrMakeOfferDto = z.infer<typeof HrMakeOfferSchema>;

export const HrAddChecklistSchema = z.object({
  items:     z.array(z.string().min(1)).optional(),
  template:  z.string().optional(),
});
export type HrAddChecklistDto = z.infer<typeof HrAddChecklistSchema>;

export const HrVacancyChannelAnnounceSchema = z.object({
  message:    z.string().optional(),
  channel_id: z.string().optional(),
});
export type HrVacancyChannelAnnounceDto = z.infer<typeof HrVacancyChannelAnnounceSchema>;

export const HrInternalApplySchema = z.object({
  motivation: z.string().optional(),
  cv_url:     z.string().optional(),
  note:       z.string().optional(),
});
export type HrInternalApplyDto = z.infer<typeof HrInternalApplySchema>;
