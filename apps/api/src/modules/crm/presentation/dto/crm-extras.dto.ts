import { z } from 'zod';

import { MAX_SHORT_TEXT } from '@common/constants/app.constants';

export const CreateCommentDtoSchema = z.object({
  text: z.string().min(1).max(MAX_SHORT_TEXT),
  lead_id: z.number().int().positive().optional(),
  deal_id: z.number().int().positive().optional(),
  author_id: z.number().int().positive().optional(),
});
export type CreateCommentDto = z.infer<typeof CreateCommentDtoSchema>;

export const CreateTaskDtoSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(MAX_SHORT_TEXT).optional(),
  due_date: z.string().optional(),
  lead_id: z.number().int().positive().optional(),
  deal_id: z.number().int().positive().optional(),
  assignee_id: z.number().int().positive().optional(),
}).passthrough();
export type CreateTaskDto = z.infer<typeof CreateTaskDtoSchema>;
