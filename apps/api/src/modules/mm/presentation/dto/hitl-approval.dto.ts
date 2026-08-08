/**
 * @module hitl-approval.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const HitlApproveDtoSchema = z.object({
  notes: z.string().max(2000).optional(),
});
export type HitlApproveDto = z.infer<typeof HitlApproveDtoSchema>;

export const HitlRejectDtoSchema = z.object({
  reason: z.string().min(1).max(2000).optional(),
});
export type HitlRejectDto = z.infer<typeof HitlRejectDtoSchema>;
