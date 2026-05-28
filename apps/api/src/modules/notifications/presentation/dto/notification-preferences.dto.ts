/**
 * @module notification-preferences.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { ZodError } from 'zod';

// Matrix row format: FE sends { preferences: [{ key, email, telegram, inApp }] }
const PreferenceMatrixRowSchema = z.object({
  key:      z.string(),
  email:    z.boolean(),
  telegram: z.boolean(),
  inApp:    z.boolean(),
});

export const NotificationPreferencesSchema = z.object({
  // Matrix format (new FE shape)
  preferences: z.array(PreferenceMatrixRowSchema).optional(),
  // Flat format (backward compat)
  emailEnabled:      z.boolean().optional(),
  telegramEnabled:   z.boolean().optional(),
  pushEnabled:       z.boolean().optional(),
  orderUpdates:      z.boolean().optional(),
  productionAlerts:  z.boolean().optional(),
  hrAlerts:          z.boolean().optional(),
  qcAlerts:          z.boolean().optional(),
  financeAlerts:     z.boolean().optional(),
  systemAlerts:      z.boolean().optional(),
});

export type NotificationPreferencesDto = z.infer<typeof NotificationPreferencesSchema>;

export function parseNotificationPreferences(body: unknown): NotificationPreferencesDto {
  try {
    return NotificationPreferencesSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) throw new BadRequestException(e.errors[0]?.message ?? 'Validation failed');
    throw e;
  }
}
