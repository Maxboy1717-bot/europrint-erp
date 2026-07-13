/**
 * @module create-message-task.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { ZodError } from 'zod';

import { MAX_SHORT_TEXT } from '@common/constants/app.constants';

// Chat ID'lari live DB'da INTEGER, lekin FE ularni raqam-satr ("42") sifatida
// yuboradi (Phase-4 #23 schema drift). Shuning uchun UUID | raqam-satr | raqam —
// hammasini qabul qilamiz (avvalgi `z.string().uuid()` raqam-satrni rad etib,
// har chaqiruvni 400 qilardi).
const idSchema = z.union([z.string().min(1), z.number().int().positive()]);

export const CreateMessageTaskSchema = z.object({
  roomId:     idSchema,
  messageId:  idSchema,
  title:      z.string().trim().min(1, 'title majburiy').max(MAX_SHORT_TEXT),
  assignedTo: z.union([z.string(), z.number().int().positive()]).optional(),
  dueDate:    z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  priority:   z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  // Owner 2026-07-13: yaratilgan haqiqiy Kanban kartaga bog'lam (traceability).
  kanbanCardId: z.union([z.string(), z.number().int().positive()]).optional(),
});

export type CreateMessageTaskDto = z.infer<typeof CreateMessageTaskSchema>;

export function parseCreateMessageTask(body: unknown): CreateMessageTaskDto {
  try {
    return CreateMessageTaskSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      throw new BadRequestException(e.errors[0]?.message ?? 'Validation failed');
    }
    throw e;
  }
}
