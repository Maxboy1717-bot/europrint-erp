/**
 * @module notification.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const NOTIFICATION_TYPES = [
  'info', 'warning', 'error', 'success',
  'deal', 'order', 'qc_failed', 'lms_expired', 'mro_stopped',
] as const;

/**
 * Audit 2026-08-07: `userId` and `referenceId` were `z.string().uuid()`, but every id this
 * endpoint deals with is INTEGER in the live schema — `users.id`, `notifications.user_id`,
 * `notifications.reference_id` (information_schema, verified). Since main-bootstrap registers a
 * global ZodValidationPipe, a real user id like "1" or 42 failed `.uuid()` and `POST
 * /api/notifications` returned 400 for EVERY possible caller. The admin-facing manual-send route
 * was therefore unreachable, which is also why nothing exercised the delivery fixes below it.
 *
 * Accepts either a JSON number or a numeric string (FE forms send strings) and normalises to the
 * string form the CQRS command and the aggregate already expect.
 */
const IntegerIdSchema = z
  .union([z.number().int().positive(), z.string().regex(/^[1-9]\d*$/, 'ID musbat butun son bo\'lishi kerak')])
  .transform((v) => String(v));

export const CreateNotificationSchema = z.object({
  userId:        IntegerIdSchema,
  title:         z.string().min(1),
  body:          z.string().min(1),
  type:          z.enum(NOTIFICATION_TYPES),
  referenceId:   IntegerIdSchema.optional(),
  referenceType: z.string().optional(),
});

export class CreateNotificationDto extends createZodDto(CreateNotificationSchema) {}
