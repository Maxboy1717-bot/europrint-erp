/**
 * @module create-reminder.tool
 */

// NOTE: (RULE4_EXCEPTION) AIsha tools intentionally use raw SQL. Each tool
// aggregates across cross-module tables (sales, production, HR, finance,
// security, IoT, kanban, calendar) that the AIsha module does not own.
// Importing every Drizzle schema would create tight coupling between
// AIsha and every other domain module. The read-only / single-INSERT
// raw SQL keeps AIsha a loose query-adapter layer over the ERP. Drizzle
// ORM is used elsewhere; see [[aisha-final-report]] for the
// architectural rationale.

import { Injectable } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

export interface ReminderResult {
  reminderId: string;
  text:       string;
  dueAt:      string;
  recurrence: string | null;
}

@Injectable()
export class CreateReminderTool implements IAishaTool {
  readonly definition = {
    name: 'create_reminder',
    description: 'MEDIUM: Eslatma yaratish (audit log).',
    input_schema: {
      type: 'object' as const,
      properties: {
        text:        { type: 'string' },
        dueAt:       { type: 'string', description: 'ISO datetime' },
        recurrence:  { type: 'string', description: 'daily | weekly | monthly | (bo\'sh)' },
      },
      required: ['text', 'dueAt'],
    },
  };

  readonly stakeLevel = 'medium' as const;

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<ReminderResult>>> {
    const text = String(input['text'] ?? '');
    const dueAt = String(input['dueAt'] ?? '');
    const recurrence = String(input['recurrence'] ?? '') || null;
    if (!text || !dueAt) return Err(AppErr('VALIDATION', 'text va dueAt majburiy'));

    return safeCall<ToolResult<ReminderResult>>(async () => {
      const start = Date.now();
      const rows = rowsOf<{ id: string }>(await db.execute(sql`
        INSERT INTO reminders (text, due_at, recurrence, created_by)
        VALUES (${text}, ${dueAt}, ${recurrence}, 0)
        RETURNING id::text
      `));
      return provResult<ReminderResult>({
        data: { reminderId: rows[0]?.id ?? '', text, dueAt, recurrence },
        sources: [provSource({ type: 'database', identifier: 'common.reminders', startMs: start, rowCount: 1 })],
      });
    });
  }
}
