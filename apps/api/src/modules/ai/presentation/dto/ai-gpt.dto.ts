/**
 * @module ai-gpt.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { MAX_LONG_TEXT } from '@common/constants/app.constants';
import { createZodDto } from '@anatine/zod-nestjs';

export const GptTestDtoSchema = z.object({
  prompt:   z.string().min(1).max(MAX_LONG_TEXT),
  provider: z.enum(['openai', 'gemini', 'claude']).optional(),
  model:    z.string().max(100).optional(),
});

export class GptTestDto extends createZodDto(GptTestDtoSchema) {}
