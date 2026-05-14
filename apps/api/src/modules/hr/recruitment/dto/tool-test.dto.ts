/**
 * @module tool-test.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const toolTestPoint = z.number().int().min(-100).max(100);

export const CreateToolTestSchema = z.object({
  candidateId:      z.number().int(),
  vacancyId:        z.number().int().optional(),
  funnelId:         z.number().int().optional(),
  pointA:           toolTestPoint,
  pointB:           toolTestPoint,
  pointC:           toolTestPoint,
  pointD:           toolTestPoint,
  pointE:           toolTestPoint,
  pointF:           toolTestPoint,
  pointG:           toolTestPoint,
  pointH:           toolTestPoint,
  pointI:           toolTestPoint,
  pointJ:           toolTestPoint,
  compulsivePoints: z.array(z.string()).optional(),
});
export class CreateToolTestDto extends createZodDto(CreateToolTestSchema) {}

export const ToolTestMatchQuerySchema = z.object({
  positionKey: z.string().min(1),
  toolTestId:  z.number().int(),
});
export class ToolTestMatchQueryDto extends createZodDto(ToolTestMatchQuerySchema) {}
