import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { ZodError } from 'zod';

export const NotificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  telegramEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  productionAlerts: z.boolean().optional(),
  hrAlerts: z.boolean().optional(),
  qcAlerts: z.boolean().optional(),
  financeAlerts: z.boolean().optional(),
  systemAlerts: z.boolean().optional(),
}).strict();

export type NotificationPreferencesDto = z.infer<typeof NotificationPreferencesSchema>;

export function parseNotificationPreferences(body: unknown): NotificationPreferencesDto {
  try {
    return NotificationPreferencesSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) throw new BadRequestException(e.errors[0]?.message ?? 'Validation failed');
    throw e;
  }
}
