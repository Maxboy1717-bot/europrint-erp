/**
 * @module kanban.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

// ─── Boards ───────────────────────────────────────────────────────────────────

export const KanbanCreateBoardSchema = z.object({
  name:        z.string().max(255).optional(),
  type:        z.string().max(50).optional(),
  description: z.string().optional(),
});
export type KanbanCreateBoardDto = z.infer<typeof KanbanCreateBoardSchema>;

// ─── Columns ──────────────────────────────────────────────────────────────────

export const KanbanAddColumnSchema = z.object({
  name:       z.string().max(255).optional(),
  color:      z.string().max(50).optional(),
  sort_order: z.number().int().min(0).optional(),
  sortOrder:  z.number().int().min(0).optional(),
});
export type KanbanAddColumnDto = z.infer<typeof KanbanAddColumnSchema>;

export const KanbanUpdateColumnSchema = z.object({
  name:       z.string().max(255).optional(),
  color:      z.string().max(50).optional(),
  sort_order: z.number().int().min(0).optional(),
  sortOrder:  z.number().int().min(0).optional(),
});
export type KanbanUpdateColumnDto = z.infer<typeof KanbanUpdateColumnSchema>;

// ─── Cards ────────────────────────────────────────────────────────────────────

export const KanbanAddCardSchema = z.object({
  title:         z.string().max(500).optional(),
  columnId:      z.string().optional(),
  column_id:     z.string().optional(),
  description:   z.string().optional(),
  priority:      z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  dueDate:       z.string().optional(),
  due_date:      z.string().optional(),
  startDate:     z.string().optional(),
  ownerUserId:      z.string().optional(),
  owner_user_id:    z.string().optional(),
  assignerUserId:   z.string().optional(),
  assigner_user_id: z.string().optional(),
  estimatedTime: z.number().int().positive().optional(),
  projectId:     z.string().optional(),
  // Owner 4-field request (2026-07-13): Tiraj/progress, stansiya-operator, Izoh-belgi.
  // qoldiq-to'lov is intentionally absent — it's a read-only computed field, never settable.
  progress:            z.number().optional(),
  stationOperatorId:   z.string().optional(),
  station_operator_id: z.string().optional(),
  commentFlag:         z.boolean().optional(),
  comment_flag:        z.boolean().optional(),
});
export type KanbanAddCardDto = z.infer<typeof KanbanAddCardSchema>;

export const KanbanUpdateCardSchema = z.object({
  title:              z.string().max(500).optional(),
  description:        z.string().nullable().optional(),
  priority:           z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  dueDate:            z.string().nullable().optional(),
  due_date:           z.string().nullable().optional(),
  startDate:          z.string().nullable().optional(),
  start_date:         z.string().nullable().optional(),
  ownerUserId:        z.string().nullable().optional(),
  owner_user_id:      z.string().nullable().optional(),
  estimatedTime:      z.number().int().positive().nullable().optional(),
  estimated_time:     z.number().int().positive().nullable().optional(),
  status:             z.string().optional(),
  completionReport:   z.string().optional(),
  // Extended fields from TaskDetailSheet hidden section
  parentCardId:       z.string().nullable().optional(),
  parent_card_id:     z.string().nullable().optional(),
  projectId:          z.string().nullable().optional(),
  project_id:         z.string().nullable().optional(),
  relatedType:        z.string().nullable().optional(),
  related_type:       z.string().nullable().optional(),
  relatedId:          z.string().nullable().optional(),
  related_id:         z.string().nullable().optional(),
  recurrencePattern:  z.string().nullable().optional(),
  recurrence_pattern: z.string().nullable().optional(),
  recurrenceInterval: z.number().int().positive().nullable().optional(),
  recurrenceEndDate:  z.string().nullable().optional(),
  recurrence_end_date: z.string().nullable().optional(),
  // Owner 4-field request (2026-07-13): Tiraj/progress, stansiya-operator, Izoh-belgi.
  // qoldiq-to'lov is intentionally absent — it's a read-only computed field, never settable.
  progress:             z.number().nullable().optional(),
  stationOperatorId:    z.string().nullable().optional(),
  station_operator_id:  z.string().nullable().optional(),
  commentFlag:          z.boolean().nullable().optional(),
  comment_flag:         z.boolean().nullable().optional(),
});
export type KanbanUpdateCardDto = z.infer<typeof KanbanUpdateCardSchema>;

export const KanbanMoveCardSchema = z.object({
  columnId:   z.string().optional(),
  column_id:  z.string().optional(),
  sortOrder:  z.number().int().min(0).optional(),
  sort_order: z.number().int().min(0).optional(),
});
export type KanbanMoveCardDto = z.infer<typeof KanbanMoveCardSchema>;

// ─── Templates ────────────────────────────────────────────────────────────────

export const KanbanCreateTemplateSchema = z.object({
  name:           z.string().max(255).optional(),
  description:    z.string().optional(),
  type:           z.string().max(50).optional(),
  priority:       z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  boardId:        z.string().optional(),
  checklistItems: z.array(z.string()).optional(),
  columnsConfig:  z.array(z.record(z.unknown())).optional(),
});
export type KanbanCreateTemplateDto = z.infer<typeof KanbanCreateTemplateSchema>;

export const KanbanUpdateTemplateSchema = z.object({
  name:           z.string().max(255).optional(),
  description:    z.string().optional(),
  priority:       z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  checklistItems: z.array(z.string()).optional(),
  columnsConfig:  z.array(z.record(z.unknown())).optional(),
});
export type KanbanUpdateTemplateDto = z.infer<typeof KanbanUpdateTemplateSchema>;

// ─── Robots ───────────────────────────────────────────────────────────────────

export const KanbanCreateRobotSchema = z.object({
  name:      z.string().max(255).optional(),
  trigger:   z.string().optional(),
  action:    z.string().optional(),
  actions:   z.array(z.record(z.unknown())).optional(),
  is_active: z.boolean().optional(),
});
export type KanbanCreateRobotDto = z.infer<typeof KanbanCreateRobotSchema>;

// ─── Flows ────────────────────────────────────────────────────────────────────

export const KanbanCreateFlowSchema = z.object({
  boardId:        z.string(),
  name:           z.string().max(255),
  description:    z.string().optional(),
  assignmentType: z.enum(['round_robin', 'least_busy', 'random']).optional().default('round_robin'),
  userIds:        z.array(z.string()).optional(),
});
export type KanbanCreateFlowDto = z.infer<typeof KanbanCreateFlowSchema>;

// ─── Time Tracking ────────────────────────────────────────────────────────────

export const KanbanTimeEntrySchema = z.object({
  description:   z.string().max(500).optional(),
  targetMinutes: z.number().int().positive().optional(),
});
export type KanbanTimeEntryDto = z.infer<typeof KanbanTimeEntrySchema>;

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const KanbanAddTagSchema = z.object({
  name:    z.string().min(1).max(100),
  color:   z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  boardId: z.string().optional(),
  tag:     z.string().optional(),
});
export type KanbanAddTagDto = z.infer<typeof KanbanAddTagSchema>;

// ─── Results ──────────────────────────────────────────────────────────────────

export const KanbanAddResultSchema = z.object({
  description: z.string().optional(),
});
export type KanbanAddResultDto = z.infer<typeof KanbanAddResultSchema>;

// ─── File Upload ──────────────────────────────────────────────────────────────

export const KanbanFileMetaSchema = z.object({
  fileName: z.string().min(1),
  fileUrl:  z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
});
export type KanbanFileMetaDto = z.infer<typeof KanbanFileMetaSchema>;
