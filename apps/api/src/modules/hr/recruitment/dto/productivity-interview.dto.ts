/**
 * @module productivity-interview.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const WorkHistoryItemSchema = z.object({
  company:    z.string().min(1),
  position:   z.string().min(1),
  duration:   z.string().min(1),
  mainResult: z.string().min(1),
  leftReason: z.string().min(1),
});

const AchievementSchema = z.object({
  description: z.string().min(1),
  measurable:  z.boolean(),
  metric:      z.string().optional(),
});

const ProductivityInterviewDataSchema = z.object({
  hasConcreteResults:      z.boolean(),
  concreteResultsExamples: z.array(z.string()),
  canWorkIndependently:    z.boolean(),
  independenceExamples:    z.array(z.string()),
  problemSolvingExamples:  z.array(z.string()),
  achievements:            z.array(AchievementSchema),
  workHistory:             z.array(WorkHistoryItemSchema),
  overallScore:            z.number().int().min(1).max(10),
  interviewerNotes:        z.string().min(1),
});

const ReferenceItemSchema = z.object({
  name:         z.string().min(1),
  position:     z.string().min(1),
  company:      z.string().min(1),
  phone:        z.string().min(1),
  relationship: z.string().min(1),
  contactedAt:  z.string().optional(),
  feedback:     z.string().optional(),
  rating:       z.number().int().min(1).max(10).optional(),
});

const ReferenceCheckDataSchema = z.object({
  references:            z.array(ReferenceItemSchema),
  overallReferenceScore: z.number().int().min(1).max(10),
  redFlags:              z.array(z.string()),
  isCleared:             z.boolean(),
});

export const CreateProductivityInterviewSchema = z.object({
  candidateId:           z.number().int(),
  funnelId:              z.number().int().optional(),
  productivityInterview: ProductivityInterviewDataSchema,
  referenceCheck:        ReferenceCheckDataSchema.optional(),
  finalDecision:         z.enum(['APPROVE', 'REJECT', 'HOLD']).optional(),
  finalNotes:            z.string().optional(),
});
export class CreateProductivityInterviewDto extends createZodDto(CreateProductivityInterviewSchema) {}
