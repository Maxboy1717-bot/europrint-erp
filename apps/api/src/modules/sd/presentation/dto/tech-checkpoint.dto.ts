import { z } from 'zod';

export const TechCheckpointDtoSchema = z.object({
  type: z.enum(['bom', 'routing', 'card']),
});

export type TechCheckpointDto = z.infer<typeof TechCheckpointDtoSchema>;
