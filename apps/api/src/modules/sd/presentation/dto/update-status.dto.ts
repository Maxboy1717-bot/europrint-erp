/**
 * @module update-status.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const UpdateStatusDtoSchema = z.object({
  newStatus: z.string().min(1).max(50),
});

export type UpdateStatusDto = z.infer<typeof UpdateStatusDtoSchema>;
