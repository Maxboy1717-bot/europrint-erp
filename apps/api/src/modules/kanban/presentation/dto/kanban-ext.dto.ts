import { z } from 'zod';

import { MAX_DESCRIPTION_LENGTH, MAX_NOTES_LENGTH, MAX_SHORT_TEXT, MAX_NAME_LENGTH } from '@common/constants/app.constants';
export const UpdateFlowDtoSchema = z.object({
  name:        z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  description: z.string().max(MAX_NOTES_LENGTH).optional(),
  status:      z.enum(['active', 'inactive', 'archived']).optional(),
});
export type UpdateFlowDto = z.infer<typeof UpdateFlowDtoSchema>;

export const UpdateRobotDtoSchema = z.object({
  name:     z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  isActive: z.boolean().optional(),
  trigger:  z.string().max(100).optional(),
});
export type UpdateRobotDto = z.infer<typeof UpdateRobotDtoSchema>;

export const CreateChecklistDtoSchema = z.object({
  title: z.string().min(1).max(MAX_NAME_LENGTH),
});
export type CreateChecklistDto = z.infer<typeof CreateChecklistDtoSchema>;

export const UpdateChecklistDtoSchema = z.object({
  title: z.string().min(1).max(MAX_NAME_LENGTH).optional(),
});
export type UpdateChecklistDto = z.infer<typeof UpdateChecklistDtoSchema>;

export const CreateChecklistItemDtoSchema = z.object({
  title:      z.string().min(1).max(MAX_SHORT_TEXT),
  assigneeId: z.number().int().positive().optional(),
  dueDate:    z.string().optional(),
});
export type CreateChecklistItemDto = z.infer<typeof CreateChecklistItemDtoSchema>;

export const UpdateChecklistItemDtoSchema = z.object({
  title:       z.string().min(1).max(MAX_SHORT_TEXT).optional(),
  isCompleted: z.boolean().optional(),
  assigneeId:  z.number().int().positive().optional(),
  dueDate:     z.string().optional(),
});
export type UpdateChecklistItemDto = z.infer<typeof UpdateChecklistItemDtoSchema>;

export const AddCommentDtoSchema = z.object({
  content: z.string().min(1).max(MAX_DESCRIPTION_LENGTH),
});
export type AddCommentDto = z.infer<typeof AddCommentDtoSchema>;

export const UpdateBoardDtoSchema = z.object({
  name:        z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  description: z.string().max(MAX_NOTES_LENGTH).optional(),
  color:       z.string().max(50).optional(),
});
export type UpdateBoardDto = z.infer<typeof UpdateBoardDtoSchema>;
