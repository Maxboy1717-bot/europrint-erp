/**
 * @module advance-bypass.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

import { MAX_SHORT_TEXT } from '@common/constants/app.constants';
export const AdvanceBypassDtoSchema = z.object({
  reason: z.string().min(5).max(MAX_SHORT_TEXT),
});

export type AdvanceBypassDto = z.infer<typeof AdvanceBypassDtoSchema>;
