/**
 * @module schedule-meeting.tool
 */

// NOTE: Raw SQL is intentional for AIsha tools. Each tool aggregates
// across multiple cross-module tables (sales, production, HR, finance,
// security, kanban) that the AIsha module does not own. Importing every
// Drizzle schema would create tight coupling between AIsha and every
// other domain module; the read-only / single-INSERT raw SQL keeps
// AIsha as a loose query-adapter layer over the ERP. Drizzle ORM is
// used elsewhere; see [[aisha-final-report]] for the architectural
// rationale.

import { Injectable, Inject, Optional } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult } from './_helpers';
import { TELEGRAM_SENDER, type ITelegramSender } from './send-telegram-to-team.tool';

export interface MeetingResult {
  meetingId:    string;
  startAt:      string;
  attendees:    number;
  inviteSent:   number;
}

@Injectable()
export class ScheduleMeetingTool implements IAishaTool {
  readonly definition = {
    name: 'schedule_meeting',
    description: 'HIGH: Yig\'ilish yaratish + Telegram orqali taklif yuborish.',
    input_schema: {
      type: 'object' as const,
      properties: {
        attendees: { type: 'string', description: 'CSV userIds' },
        startAt:   { type: 'string', description: 'ISO datetime' },
        topic:     { type: 'string' },
        location:  { type: 'string' },
      },
      required: ['attendees', 'startAt', 'topic'],
    },
  };

  readonly stakeLevel = 'high' as const;

  constructor(
    @Optional() @Inject(TELEGRAM_SENDER)
    private readonly tg: ITelegramSender | null = null,
  ) {}

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<MeetingResult>>> {
    const attendees = String(input['attendees'] ?? '').split(',').map(s => parseInt(s.trim(), 10)).filter(Number.isFinite);
    const startAt = String(input['startAt'] ?? '');
    const topic = String(input['topic'] ?? '');
    const location = String(input['location'] ?? '');
    if (attendees.length === 0) return Err(AppErr('VALIDATION', 'attendees bo\'sh bo\'lmasligi kerak'));
    if (!startAt || !topic) return Err(AppErr('VALIDATION', 'startAt va topic majburiy'));

    return safeCall<ToolResult<MeetingResult>>(async () => {
      const start = Date.now();
      const rows = await db.execute(sql`
        INSERT INTO calendar_events (title, start_at, location, created_by)
        VALUES (${topic}, ${startAt}, ${location}, 0)
        RETURNING id::text
      `);
      const meetingId = ((rows as { rows?: Array<{ id: string }> }).rows ?? [])[0]?.id ?? '';
      let inviteSent = 0;
      if (this.tg) {
        for (const userId of attendees) {
          const chat = (await db.execute(sql`SELECT chat_id FROM telegram_user_links WHERE user_id = ${userId} LIMIT 1`) as { rows?: Array<{ chat_id: string }> }).rows?.[0]?.chat_id;
          if (!chat) continue;
          const r = await this.tg.sendMessage(chat, `Yig'ilish: ${topic}\n${startAt}${location ? `\n${location}` : ''}`);
          if (r.ok) inviteSent++;
        }
      }
      return provResult<MeetingResult>({
        data: { meetingId, startAt, attendees: attendees.length, inviteSent },
        sources: [
          provSource({ type: 'database', identifier: 'calendar.events', startMs: start, rowCount: 1 }),
          provSource({ type: 'api', identifier: 'telegram.bot', startMs: start, rowCount: inviteSent }),
        ],
      });
    });
  }
}
