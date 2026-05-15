/**
 * @module assign-task.tool
 */

// NOTE: Raw SQL is intentional for AIsha tools. Each tool aggregates
// across multiple cross-module tables (sales, production, HR, finance,
// security, kanban) that the AIsha module does not own. Importing every
// Drizzle schema would create tight coupling between AIsha and every
// other domain module; the read-only / single-INSERT raw SQL keeps
// AIsha as a loose query-adapter layer over the ERP. Drizzle ORM is
// used elsewhere; see [[aisha-final-report]] for the architectural
// rationale.

import { Injectable } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

export interface AssignedTask {
  taskId:    string;
  assignee:  number;
  boardId:   string;
}

@Injectable()
export class AssignTaskTool implements IAishaTool {
  readonly definition = {
    name: 'assign_task',
    description: 'MEDIUM: Xodimga Kanban tasksini biriktirish.',
    input_schema: {
      type: 'object' as const,
      properties: {
        assignee:    { type: 'string', description: 'Xodim IDsi' },
        title:       { type: 'string' },
        description: { type: 'string' },
        dueDate:     { type: 'string' },
      },
      required: ['assignee', 'title'],
    },
  };

  readonly stakeLevel = 'medium' as const;

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<AssignedTask>>> {
    const assignee = parseInt(String(input['assignee'] ?? ''), 10);
    const title = String(input['title'] ?? '');
    const description = String(input['description'] ?? '');
    const dueDate = String(input['dueDate'] ?? '') || null;
    if (!Number.isFinite(assignee) || !title) return Err(AppErr('VALIDATION', 'assignee va title majburiy'));

    return safeCall<ToolResult<AssignedTask>>(async () => {
      const start = Date.now();
      const board = rowsOf<{ id: string }>(await db.execute(sql`
        SELECT id::text FROM kanban_boards WHERE owner_id = ${assignee} LIMIT 1
      `))[0];
      const boardId = board?.id ?? '';
      const rows = rowsOf<{ id: string }>(await db.execute(sql`
        INSERT INTO kanban_cards (board_id, title, description, due_date, assignee_id, status)
        VALUES (${boardId}, ${title}, ${description}, ${dueDate}, ${assignee}, 'todo')
        RETURNING id::text
      `));
      return provResult<AssignedTask>({
        data: { taskId: rows[0]?.id ?? '', assignee, boardId },
        sources: [provSource({ type: 'database', identifier: 'kanban.cards', startMs: start, rowCount: 1 })],
        citations: [{ label: title, url: `/kanban/cards/${rows[0]?.id ?? ''}` }],
      });
    });
  }
}
