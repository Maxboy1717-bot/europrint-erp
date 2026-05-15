/**
 * @module send-telegram-to-team.tool
 * @description HIGH-stake action. The orchestrator must intercept this tool,
 * create a PendingApproval VO, and only call `execute()` after the Director
 * confirms by voice. We DO NOT short-circuit the approval inside the tool —
 * the gate lives in the orchestrator so audit covers both the request and
 * the explicit consent.
 */

// RULE4_EXCEPTION: AIsha tools intentionally use raw SQL. Each tool
// aggregates across cross-module tables (sales, production, HR, finance,
// security, IoT, kanban, calendar) that the AIsha module does not own.
// Importing every Drizzle schema would create tight coupling between
// AIsha and every other domain module. The read-only / single-INSERT
// raw SQL keeps AIsha a loose query-adapter layer over the ERP. Drizzle
// ORM is used elsewhere; see [[aisha-final-report]] for the
// architectural rationale.

import { Injectable, Inject, Optional } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

export type RecipientGroup = 'departmentHeads' | 'all' | 'specific';

export interface TelegramSendResult {
  delivered:  number;
  failed:     number;
  recipients: number[];
}

export interface ITelegramSender {
  sendMessage(chatId: number | string, text: string): Promise<{ ok: boolean }>;
}

export const TELEGRAM_SENDER = Symbol('AISHA_TELEGRAM_SENDER');

@Injectable()
export class SendTelegramToTeamTool implements IAishaTool {
  readonly definition = {
    name: 'send_telegram_to_team',
    description: 'HIGH: Telegram orqali jamoaga xabar yuborish (ovozli tasdiqlash kerak).',
    input_schema: {
      type: 'object' as const,
      properties: {
        recipients: { type: 'string', description: 'departmentHeads | all | csv(userIds)' },
        message:    { type: 'string' },
      },
      required: ['recipients', 'message'],
    },
  };

  readonly stakeLevel = 'high' as const;

  constructor(
    @Optional() @Inject(TELEGRAM_SENDER)
    private readonly sender: ITelegramSender | null = null,
  ) {}

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<TelegramSendResult>>> {
    const recipientsRaw = String(input['recipients'] ?? '');
    const message = String(input['message'] ?? '');
    if (!message || message.trim().length === 0) return Err(AppErr('VALIDATION', 'message bo\'sh bo\'lmasligi kerak'));
    if (!this.sender) return Err(AppErr('EXTERNAL_SERVICE', 'TelegramSender provayderi yo\'q'));

    return safeCall<ToolResult<TelegramSendResult>>(async () => {
      const start = Date.now();
      const userIds = await this.resolveRecipients(recipientsRaw);
      const chats = rowsOf<{ user_id: number; chat_id: string }>(await db.execute(sql`
        SELECT user_id, chat_id FROM telegram_user_links WHERE user_id = ANY(${userIds})
      `));
      let delivered = 0, failed = 0;
      for (const c of chats) {
        const r = await this.sender!.sendMessage(c.chat_id, message);
        if (r.ok) delivered++; else failed++;
      }
      return provResult<TelegramSendResult>({
        data: { delivered, failed, recipients: userIds },
        sources: [
          provSource({ type: 'database', identifier: 'hr.employees', startMs: start, rowCount: userIds.length }),
          provSource({ type: 'api', identifier: 'telegram.bot', startMs: start, rowCount: chats.length }),
        ],
      });
    });
  }

  private async resolveRecipients(raw: string): Promise<number[]> {
    if (raw === 'departmentHeads') {
      return rowsOf<{ id: number }>(await db.execute(sql`SELECT id FROM hr_employees WHERE role = 'department_head'`))
        .map(r => r.id);
    }
    if (raw === 'all') {
      return rowsOf<{ id: number }>(await db.execute(sql`SELECT id FROM hr_employees WHERE active = true`))
        .map(r => r.id);
    }
    return raw.split(',').map(s => parseInt(s.trim(), 10)).filter(Number.isFinite);
  }
}
