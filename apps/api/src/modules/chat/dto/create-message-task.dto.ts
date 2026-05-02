import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { ZodError } from 'zod';

import { MAX_SHORT_TEXT } from '@common/constants/app.constants';

const idSchema = z.union([z.string().uuid(), z.number().int().positive()]);

export const CreateMessageTaskSchema = z.object({
  roomId:     idSchema,
  messageId:  idSchema,
  title:      z.string().trim().min(1, 'title majburiy').max(MAX_SHORT_TEXT),
  assignedTo: z.union([z.string(), z.number().int().positive()]).optional(),
  dueDate:    z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  priority:   z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
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
