/**
 * @module create-funnel.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

/**
 * Stage codes accepted by the recruitment funnel API. Mirrors the canonical
 * list in `domain/value-objects/funnel-stage.vo.ts` (the VO owns the source of
 * truth; this re-asserts it here so the DTO module does not depend on the
 * domain layer — same dependency-direction note as the VO file).
 *
 * Owner's 7-stage Human-Capital funnel first (EP-HR-016, docs/audit/
 * decisions/02-hr.md), then the legacy 12-stage ATS codes kept as aliases so
 * the 11 live `hr_candidate_funnels` rows still validate (Q-39 no-regression).
 */
export const HC_FUNNEL_STAGES = [
  'PORTRET', 'UPAKOVKA', 'POTOK', 'TEZ_ISHLOV',
  'BAHOLASH', 'LAVOZIMGA_KIRITISH', 'KUCHAYTIRISH',
] as const;

export const FUNNEL_STAGES = [
  // Owner's 7 HC stages (canonical)
  'PORTRET', 'UPAKOVKA', 'POTOK', 'TEZ_ISHLOV',
  'BAHOLASH', 'LAVOZIMGA_KIRITISH', 'KUCHAYTIRISH',
  // Legacy 12-stage ATS aliases + extra live codes (REFERENCES / SINOV_COMPLETE)
  'NEW', 'QUESTIONNAIRE_SENT', 'PHONE_SCREENING', 'INTERVIEW_SCHEDULED',
  'INTERVIEWED', 'TEST_SENT', 'TEST_ANALYSIS', 'REFERENCES_CHECK',
  'PROBATION', 'OFFER_SENT', 'HIRED', 'REJECTED',
  'REFERENCES', 'SINOV_COMPLETE',
] as const;

export type FunnelStage = typeof FUNNEL_STAGES[number];

export type ProductivityCategory =
  | 'FLAGMAN'
  | 'PROTSESSNIK'
  | 'TRABLDAYKER'
  | 'UNKNOWN';

export type CandidateSource =
  | 'HH_UZ'
  | 'OLX_UZ'
  | 'TELEGRAM'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'LINKEDIN'
  | 'REFERRAL'
  | 'PRINT'
  | 'WEBSITE'
  | 'OTHER';

const CANDIDATE_SOURCES = [
  'HH_UZ', 'OLX_UZ', 'TELEGRAM', 'INSTAGRAM', 'FACEBOOK',
  'LINKEDIN', 'REFERRAL', 'PRINT', 'WEBSITE', 'OTHER',
] as const;

export const CreateFunnelSchema = z.object({
  candidateId:          z.number().int(),
  vacancyId:            z.number().int().optional(),
  source:               z.enum(CANDIDATE_SOURCES).optional(),
  sourceDetails:        z.string().optional(),
  referredById:         z.number().int().optional(),
  assignedRecruiterId:  z.number().int().optional(),
});
export class CreateFunnelDto extends createZodDto(CreateFunnelSchema) {}

export const MoveFunnelStageSchema = z.object({
  newStage: z.enum(FUNNEL_STAGES),
  notes:    z.string().optional(),
});
export class MoveFunnelStageDto extends createZodDto(MoveFunnelStageSchema) {}

export const QuickScreeningSchema = z.object({
  screeningScore:       z.number().int().min(1).max(10),
  notes:                z.string().optional(),
  isQuickRejected:      z.boolean().optional(),
  quickRejectionReason: z.string().optional(),
});
export class QuickScreeningDto extends createZodDto(QuickScreeningSchema) {}

export const ListFunnelSchema = z.object({
  page:                 z.coerce.number().int().optional(),
  limit:                z.coerce.number().int().optional(),
  stage:                z.enum(FUNNEL_STAGES).optional(),
  vacancyId:            z.coerce.number().int().optional(),
  recruiterId:          z.coerce.number().int().optional(),
  productivityCategory: z.string().optional(),
});
export class ListFunnelDto extends createZodDto(ListFunnelSchema) {}
