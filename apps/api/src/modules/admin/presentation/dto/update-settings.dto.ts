/**
 * @module update-settings.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const UpdateSettingsSchema = z.object({
  advancePercent: z
    .number()
    .min(0, 'Advance percent 0 tadan kam bo\'lmasa kerak')
    .max(100, 'Advance percent 100 tadan ko\'p bo\'lmasa kerak')
    .optional(),
  freeStorageDays: z
    .number()
    .min(0, 'Free storage days 0 tadan kam bo\'lmasa kerak')
    .optional(),
  storageDailyRate: z
    .number()
    .min(0, 'Storage daily rate 0 tadan kam bo\'lmasa kerak')
    .optional(),
});

export type UpdateSettingsDto = z.infer<typeof UpdateSettingsSchema>;
