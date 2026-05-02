import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const NOTIFICATION_TYPES = [
  'info', 'warning', 'error', 'success',
  'deal', 'order', 'qc_failed', 'lms_expired', 'mro_stopped',
] as const;

export const CreateNotificationSchema = z.object({
  userId:        z.string().uuid(),
  title:         z.string().min(1),
  body:          z.string().min(1),
  type:          z.enum(NOTIFICATION_TYPES),
  referenceId:   z.string().uuid().optional(),
  referenceType: z.string().optional(),
});

export class CreateNotificationDto extends createZodDto(CreateNotificationSchema) {}
