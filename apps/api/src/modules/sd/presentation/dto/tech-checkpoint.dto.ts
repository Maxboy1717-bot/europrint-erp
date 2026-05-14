/**
 * @module tech-checkpoint.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const TechCheckpointDtoSchema = z.object({
  type: z.enum(['bom', 'routing', 'card']),
});

export type TechCheckpointDto = z.infer<typeof TechCheckpointDtoSchema>;
