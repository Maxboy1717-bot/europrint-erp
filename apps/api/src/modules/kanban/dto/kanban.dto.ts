import { z } from 'zod';

export const KanbanCreateBoardSchema = z.object({
  name:        z.string().max(255).optional(),
  type:        z.string().max(50).optional(),
  description: z.string().optional(),
});
export type KanbanCreateBoardDto = z.infer<typeof KanbanCreateBoardSchema>;

export const KanbanAddColumnSchema = z.object({
  name:       z.string().max(255).optional(),
  color:      z.string().max(50).optional(),
  sort_order: z.number().int().min(0).optional(),
});
export type KanbanAddColumnDto = z.infer<typeof KanbanAddColumnSchema>;

export const KanbanUpdateColumnSchema = z.object({
  name:       z.string().max(255).optional(),
  color:      z.string().max(50).optional(),
  sort_order: z.number().int().min(0).optional(),
});
export type KanbanUpdateColumnDto = z.infer<typeof KanbanUpdateColumnSchema>;

export const KanbanAddCardSchema = z.object({
  title:        z.string().max(500).optional(),
  columnId:     z.string().optional(),
  column_id:    z.string().optional(),
  description:  z.string().optional(),
  priority:     z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  dueDate:      z.string().optional(),
  due_date:     z.string().optional(),
  ownerUserId:  z.string().optional(),
  owner_user_id: z.string().optional(),
});
export type KanbanAddCardDto = z.infer<typeof KanbanAddCardSchema>;

export const KanbanUpdateCardSchema = z.object({
  title:        z.string().max(500).optional(),
  description:  z.string().optional(),
  priority:     z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  dueDate:      z.string().optional(),
  due_date:     z.string().optional(),
  ownerUserId:  z.string().optional(),
  owner_user_id: z.string().optional(),
});
export type KanbanUpdateCardDto = z.infer<typeof KanbanUpdateCardSchema>;

export const KanbanMoveCardSchema = z.object({
  columnId:   z.string().optional(),
  column_id:  z.string().optional(),
  sortOrder:  z.number().int().min(0).optional(),
  sort_order: z.number().int().min(0).optional(),
});
export type KanbanMoveCardDto = z.infer<typeof KanbanMoveCardSchema>;

export const KanbanCreateTemplateSchema = z.object({
  name:        z.string().max(255).optional(),
  description: z.string().optional(),
  type:        z.string().max(50).optional(),
});
export type KanbanCreateTemplateDto = z.infer<typeof KanbanCreateTemplateSchema>;

export const KanbanUpdateTemplateSchema = z.object({
  name:        z.string().max(255).optional(),
  description: z.string().optional(),
});
export type KanbanUpdateTemplateDto = z.infer<typeof KanbanUpdateTemplateSchema>;

export const KanbanCreateRobotSchema = z.object({
  name:      z.string().max(255).optional(),
  trigger:   z.string().optional(),
  action:    z.string().optional(),
  is_active: z.boolean().optional(),
});
export type KanbanCreateRobotDto = z.infer<typeof KanbanCreateRobotSchema>;
