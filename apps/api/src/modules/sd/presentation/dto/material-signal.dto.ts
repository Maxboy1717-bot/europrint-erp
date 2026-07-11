/**
 * @module material-signal.dto
 * @description DTO + Zod schema (06-sd #100). Body for the "Ожд.Сырьё" material signal:
 *   an optional free-text reason describing which roll/material is missing.
 */

import { z } from 'zod';

export const MaterialSignalDtoSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type MaterialSignalDto = z.infer<typeof MaterialSignalDtoSchema>;
