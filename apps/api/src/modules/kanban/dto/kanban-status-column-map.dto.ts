/**
 * @module kanban-status-column-map.dto
 * @description DTO + Zod schema for the SD-status -> Kanban-column mapping CRUD
 *   (`kanban_status_column_map`, schema-kanban.ts:97-102). This is the in-app
 *   configuration surface for the auto-move mechanism already implemented in
 *   `KanbanCardsRepository.moveOrderCardByStatusMap` — DO NOT confuse these
 *   schemas with that mechanism; they only validate the CRUD payloads here.
 */

import { z } from 'zod';

export const KanbanCreateStatusColumnMapSchema = z.object({
  sdStatus:       z.string().trim().min(1, "sdStatus bo'sh bo'lishi mumkin emas").max(64),
  kanbanColumnId: z.number().int().positive("kanbanColumnId musbat butun son bo'lishi kerak"),
});
export type KanbanCreateStatusColumnMapDto = z.infer<typeof KanbanCreateStatusColumnMapSchema>;

export const KanbanUpdateStatusColumnMapSchema = z.object({
  sdStatus:       z.string().trim().min(1).max(64).optional(),
  kanbanColumnId: z.number().int().positive().optional(),
}).refine(
  (d) => d.sdStatus !== undefined || d.kanbanColumnId !== undefined,
  { message: "Kamida bitta maydon (sdStatus yoki kanbanColumnId) ko'rsatilishi kerak" },
);
export type KanbanUpdateStatusColumnMapDto = z.infer<typeof KanbanUpdateStatusColumnMapSchema>;
