/**
 * @module ai-planning.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

import { MAX_NOTES_LENGTH, MAX_SHORT_TEXT } from '@common/constants/app.constants';
export const GeneratePlanDtoSchema = z.object({
  planType: z.enum(['daily', 'weekly', 'shift']).default('daily'),
  planDate: z.string().optional(),
  config:   z.record(z.string(), z.unknown()).optional(),
});

export const ApprovePlanDtoSchema = z.object({
  isOverride: z.boolean().default(false),
  reason:     z.string().max(MAX_SHORT_TEXT).optional(),
});

export const RejectPlanDtoSchema = z.object({
  reason: z.string().min(1).max(MAX_SHORT_TEXT),
});

export const UpdatePlanningConfigDtoSchema = z.object({
  autoApprovalThreshold:    z.number().min(0).max(100).optional(),
  maxShiftHours:            z.number().min(4).max(24).optional(),
  batchGroupingEnabled:     z.boolean().optional(),
  energyOptimizationWeight: z.number().min(0).max(1).optional(),
  changeoverMinutes:        z.number().min(0).max(120).optional(),
});

export const CreatePlanDtoSchema = z.object({
  planType: z.enum(['daily', 'weekly', 'shift']),
  planDate: z.string(),
  notes:    z.string().max(MAX_NOTES_LENGTH).optional(),
});

export const ReschedulePlanDtoSchema = z.object({
  newDate: z.string().min(1, 'newDate majburiy'),
});

export const BlockMaterialDtoSchema = z.object({
  materialId: z.string().min(1, 'materialId majburiy'),
  quantity:   z.number().positive().optional(),
  reason:     z.string().max(MAX_SHORT_TEXT).optional(),
});

export class GeneratePlanDto          extends createZodDto(GeneratePlanDtoSchema) {}
export class ApprovePlanDto           extends createZodDto(ApprovePlanDtoSchema) {}
export class RejectPlanDto            extends createZodDto(RejectPlanDtoSchema) {}
export class UpdatePlanningConfigDto  extends createZodDto(UpdatePlanningConfigDtoSchema) {}
export class CreatePlanDto            extends createZodDto(CreatePlanDtoSchema) {}
export class ReschedulePlanDto        extends createZodDto(ReschedulePlanDtoSchema) {}
export class BlockMaterialDto         extends createZodDto(BlockMaterialDtoSchema) {}
