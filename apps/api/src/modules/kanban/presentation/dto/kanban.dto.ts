/**
 * @module kanban.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

import { MAX_DESCRIPTION_LENGTH } from '@common/constants/app.constants';
export const CreateTaskDtoSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(0).max(MAX_DESCRIPTION_LENGTH).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
});

export type CreateTaskDto = z.infer<typeof CreateTaskDtoSchema>;

export const UpdateTaskDtoSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(0).max(MAX_DESCRIPTION_LENGTH).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
});

export type UpdateTaskDto = z.infer<typeof UpdateTaskDtoSchema>;
