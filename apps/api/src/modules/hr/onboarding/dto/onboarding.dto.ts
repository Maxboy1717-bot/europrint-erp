/**
 * @module onboarding.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const CreateOnboardingPlanSchema = z.object({
  name:             z.string().min(1),
  nameRu:           z.string().optional(),
  positionId:       z.number().int().optional(),
  departmentId:     z.number().int().optional(),
  // 2026-07-13 (HR-ORG audit §4.1): card-centric plan binding (org_departments.id). Without
  // this, a plan could never be resolved FROM a card — the root cause of "reja↔karta binding
  // ishlamagan". See DrizzleHrOnboardingRepository.createPlan/findActivePlanByCard.
  cardId:           z.number().int().positive().optional(),
  probationDays:    z.number().int().optional(),
  weeklyPlan:       z.array(z.record(z.any())).default([]),
  successCriteria:  z.array(z.record(z.any())).optional(),
});
export class CreateOnboardingPlanDto extends createZodDto(CreateOnboardingPlanSchema) {}

const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'ISO date string expected' });

export const StartEmployeeOnboardingSchema = z.object({
  employeeId: z.number().int(),
  planId:     z.number().int(),
  mentorId:   z.number().int().optional(),
  startDate:  isoDate,
  // SB0072/SB0101: onboarding nishon-kartasi (org_departments.id) — bo'lsa, probation
  // o'tgach shu karta employee_cards'ga faollashtiriladi (OnboardingService.completeProbation).
  cardId:     z.number().int().positive().optional(),
});
export class StartEmployeeOnboardingDto extends createZodDto(StartEmployeeOnboardingSchema) {}

export const UpdateOnboardingProgressSchema = z.object({
  week:              z.number().int().min(1).max(6),
  completedTasks:    z.number().int(),
  totalTasks:        z.number().int(),
  checkpointPassed:  z.boolean(),
  notes:             z.string().optional(),
});
export class UpdateOnboardingProgressDto extends createZodDto(UpdateOnboardingProgressSchema) {}

export const CompleteProbationSchema = z.object({
  probationScore:    z.number().int().min(1).max(100),
  probationNotes:    z.string().optional(),
  isProbationPassed: z.boolean(),
});
export class CompleteProbationDto extends createZodDto(CompleteProbationSchema) {}

export const CreateJobDescriptionSchema = z.object({
  positionId:            z.number().int(),
  title:                 z.string().min(1),
  titleRu:               z.string().optional(),
  department:            z.string().optional(),
  reportsTo:             z.string().optional(),
  positionPurpose:       z.string().min(1),
  positionPurposeRu:     z.string().optional(),
  keyResponsibilities:   z.array(z.record(z.any())).default([]),
  kpiMetrics:            z.array(z.record(z.any())).default([]),
  requirements:          z.record(z.any()).optional(),
  idealToolTestProfile:  z.record(z.any()).optional(),
  compensationStructure: z.record(z.any()).optional(),
});
export class CreateJobDescriptionDto extends createZodDto(CreateJobDescriptionSchema) {}

export const OnboardingCreateMotivationSchema = z.object({
  toneScaleLevel:       z.number().int().min(1).max(10).optional(),
  toneScaleDescription: z.string().max(500).optional(),
  orientationType:      z.string().max(100).optional(),
  orientationNotes:     z.string().optional(),
  motivationFactors:    z.record(z.unknown()).optional(),
  actionPlan:           z.array(z.unknown()).optional(),
});
export type OnboardingCreateMotivationDto = z.infer<typeof OnboardingCreateMotivationSchema>;
