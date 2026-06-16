/**
 * @module update-status.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

// #04 SD fix: the FE sends { status }, the BE expected { newStatus } → every status PATCH 400'd.
// Accept either key (newStatus preferred, status alias), normalize to { newStatus }.
export const UpdateStatusDtoSchema = z
  .object({
    newStatus: z.string().min(1).max(50).optional(),
    status: z.string().min(1).max(50).optional(),
    note: z.string().max(2000).optional(),
  })
  .refine((d) => !!(d.newStatus ?? d.status), { message: 'newStatus (yoki status) majburiy' })
  .transform((d) => ({ newStatus: (d.newStatus ?? d.status) as string, note: d.note }));

export type UpdateStatusDto = z.infer<typeof UpdateStatusDtoSchema>;
