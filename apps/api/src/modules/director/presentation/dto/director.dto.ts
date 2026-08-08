/**
 * @module director.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { MAX_NOTES_LENGTH, MAX_SHORT_TEXT } from '@common/constants/app.constants';

export const CoordinationCreateDoklaSchema = z.object({
  // accept both 'title' and 'subject' — frontend uses 'subject'
  title:         z.string().min(1).max(MAX_SHORT_TEXT).optional(),
  subject:       z.string().min(1).max(MAX_SHORT_TEXT).optional(),
  description:   z.string().max(MAX_NOTES_LENGTH).optional(),
  problem:       z.string().max(MAX_NOTES_LENGTH).optional(),
  result:        z.string().max(MAX_NOTES_LENGTH).optional(),
  proposal:      z.string().max(MAX_NOTES_LENGTH).optional(),
  council_level: z.union([z.string(), z.number()]).optional(),
  assignee_id:   z.number().int().positive().optional(),
  due_date:      z.string().optional(),
}).refine(d => !!(d.title || d.subject), { message: 'title yoki subject majburiy' });
export type CoordinationCreateDoklaDto = z.infer<typeof CoordinationCreateDoklaSchema>;

// Separate update schemas for dokla vs rasporyazhenie
export const CoordinationUpdateDoklaSchema = z.object({
  status: z.enum(['sent', 'read', 'resolved']).optional(),
});
export type CoordinationUpdateDoklaDto = z.infer<typeof CoordinationUpdateDoklaSchema>;

export const CoordinationUpdateRaspSchema = z.object({
  status: z.enum(['assigned', 'in_progress', 'done', 'overdue']).optional(),
});
export type CoordinationUpdateRaspDto = z.infer<typeof CoordinationUpdateRaspSchema>;

export const CoordinationMarkDoneSchema = z.object({
  note: z.string().max(MAX_NOTES_LENGTH).nullish(),
});
export type CoordinationMarkDoneDto = z.infer<typeof CoordinationMarkDoneSchema>;

export const CoordinationCreateRaspSchema = z.object({
  // accept both 'title' and 'task' — frontend uses 'task'
  title:       z.string().min(1).max(MAX_SHORT_TEXT).optional(),
  task:        z.string().min(1).max(MAX_SHORT_TEXT).optional(),
  description: z.string().max(MAX_NOTES_LENGTH).optional(),
  deadline:    z.string().optional(),
  assignee_id: z.number().int().positive().optional(),
  to_user:     z.string().optional(),
  priority:    z.enum(['low', 'normal', 'high', 'urgent', 'medium']).optional(),
}).refine(d => !!(d.title || d.task), { message: 'title yoki task majburiy' });
export type CoordinationCreateRaspDto = z.infer<typeof CoordinationCreateRaspSchema>;

// Owner decision 2026-07-13 (chat): quorum_numerator/quorum_denominator — per-council kvorum
// override (councils.quorum_numerator/quorum_denominator, nullable). Berilmasa yoki NULL
// qolsa council-quorum.service.ts global COUNCIL_QUORUM_NUMERATOR/DENOMINATOR (2/3) ga qaytadi.
export const CoordinationUpdateCouncilSchema = z.object({
  chairperson_id:     z.number().int().positive().optional(),
  description:        z.string().max(500).optional(),
  meeting_schedule:   z.string().max(200).optional(),
  quorum_numerator:   z.number().int().min(0).optional(),
  quorum_denominator: z.number().int().min(1).optional(),
}).refine(
  d => d.chairperson_id !== undefined || d.description !== undefined || d.meeting_schedule !== undefined
    || d.quorum_numerator !== undefined || d.quorum_denominator !== undefined,
  { message: 'Kamida bitta maydon kerak' },
).refine(
  d => d.quorum_numerator === undefined || d.quorum_denominator === undefined
    || d.quorum_numerator <= d.quorum_denominator,
  { message: 'quorum_numerator quorum_denominator dan katta bo\'lmasligi kerak' },
);
export type CoordinationUpdateCouncilDto = z.infer<typeof CoordinationUpdateCouncilSchema>;

export const KaizenCreateSuggestionSchema = z.object({
  title:            z.string().min(1).max(MAX_SHORT_TEXT),
  description:      z.string().min(1).max(MAX_NOTES_LENGTH),
  category:         z.string().optional(),
  expected_benefit: z.string().max(MAX_NOTES_LENGTH).nullish(),
});
export type KaizenCreateSuggestionDto = z.infer<typeof KaizenCreateSuggestionSchema>;

export const KaizenUpdateSuggestionSchema = z.object({
  status:               z.string().optional(),
  review_comment:       z.string().max(MAX_NOTES_LENGTH).nullish(),
  implementation_notes: z.string().max(MAX_NOTES_LENGTH).nullish(),
});
export type KaizenUpdateSuggestionDto = z.infer<typeof KaizenUpdateSuggestionSchema>;

export const OkrCreateObjectiveSchema = z.object({
  title:       z.string().min(1).max(MAX_SHORT_TEXT),
  type:        z.string().optional(),
  year:        z.coerce.number().int().optional(),
  quarter:     z.string().optional(),
  description: z.string().max(MAX_NOTES_LENGTH).nullish(),
});
export type OkrCreateObjectiveDto = z.infer<typeof OkrCreateObjectiveSchema>;

export const OkrUpdateObjectiveSchema = z.object({
  title:       z.string().max(MAX_SHORT_TEXT).nullish(),
  status:      z.string().nullish(),
  description: z.string().max(MAX_NOTES_LENGTH).nullish(),
});
export type OkrUpdateObjectiveDto = z.infer<typeof OkrUpdateObjectiveSchema>;

export const OkrCreateKeyResultSchema = z.object({
  objective_id:  z.coerce.number().int().positive(),
  title:         z.string().min(1).max(MAX_SHORT_TEXT),
  target_value:  z.coerce.number().optional(),
  current_value: z.coerce.number().optional(),
  unit:          z.string().optional(),
});
export type OkrCreateKeyResultDto = z.infer<typeof OkrCreateKeyResultSchema>;

export const OkrUpdateKeyResultSchema = z.object({
  current_value: z.coerce.number().nullish(),
  status:        z.string().nullish(),
  title:         z.string().max(MAX_SHORT_TEXT).nullish(),
});
export type OkrUpdateKeyResultDto = z.infer<typeof OkrUpdateKeyResultSchema>;

export const ZnoCommentSchema = z.object({
  comment: z.string().max(MAX_NOTES_LENGTH).nullish(),
});
export type ZnoCommentDto = z.infer<typeof ZnoCommentSchema>;

export const ZnoCreateSchema = z.object({
  purpose:        z.string().min(1).max(MAX_NOTES_LENGTH),
  amount:         z.coerce.number().positive(),
  department_id:  z.coerce.number().int().positive().optional(),
  submitter_name: z.string().max(MAX_SHORT_TEXT).optional(),
  payment_date:   z.string().optional(),
});
export type ZnoCreateDto = z.infer<typeof ZnoCreateSchema>;

export const ZnoUpdateSchema = z.object({
  status:  z.enum(['pending', 'approved', 'rejected', 'paid']).nullish(),
  comment: z.string().max(MAX_NOTES_LENGTH).nullish(),
});
export type ZnoUpdateDto = z.infer<typeof ZnoUpdateSchema>;

export const ZvsCommentSchema = z.object({
  comment: z.string().max(MAX_NOTES_LENGTH).nullish(),
});
export type ZvsCommentDto = z.infer<typeof ZvsCommentSchema>;

export const ZvsCreateSchema = z.object({
  purpose:        z.string().min(1).max(MAX_NOTES_LENGTH),
  amount:         z.coerce.number().positive(),
  department_id:  z.coerce.number().int().positive().optional(),
  submitter_name: z.string().max(MAX_SHORT_TEXT).optional(),
  priority:       z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  week_date:      z.string().optional(),
});
export type ZvsCreateDto = z.infer<typeof ZvsCreateSchema>;

export const SfCreateFunctionSchema = z.object({
  name:        z.string().min(1).max(MAX_SHORT_TEXT),
  description: z.string().max(MAX_NOTES_LENGTH).optional(),
  owner_id:    z.number().int().positive().optional(),
  order_index: z.number().int().min(1).optional(),
});
export type SfCreateFunctionDto = z.infer<typeof SfCreateFunctionSchema>;

export const SfUpdateFunctionSchema = z.object({
  name:        z.string().max(MAX_SHORT_TEXT).optional(),
  description: z.string().max(MAX_NOTES_LENGTH).optional(),
  owner_id:    z.number().int().positive().optional(),
  order_index: z.number().int().min(1).optional(),
});
export type SfUpdateFunctionDto = z.infer<typeof SfUpdateFunctionSchema>;

export const SfCreateKpiSchema = z.object({
  function_id:   z.coerce.number().int().positive(),
  name:          z.string().min(1).max(MAX_SHORT_TEXT),
  target_value:  z.coerce.number().optional(),
  unit:          z.string().optional(),
  responsible_id: z.coerce.number().int().positive().optional(),
  frequency:     z.string().optional(),
});
export type SfCreateKpiDto = z.infer<typeof SfCreateKpiSchema>;

export const SfUpdateKpiSchema = z.object({
  name:           z.string().max(MAX_SHORT_TEXT).optional(),
  target_value:   z.coerce.number().optional(),
  actual_value:   z.coerce.number().optional(),
  unit:           z.string().optional(),
  responsible_id: z.coerce.number().int().positive().optional(),
});
export type SfUpdateKpiDto = z.infer<typeof SfUpdateKpiSchema>;

export const SfAnalyzeFunctionSchema = z.object({
  function_id: z.coerce.number().int().positive(),
});
export type SfAnalyzeFunctionDto = z.infer<typeof SfAnalyzeFunctionSchema>;
