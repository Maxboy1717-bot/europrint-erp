/**
 * Universal alert service — barcha agentlar bildirishnomalarni shu servis orqali yuboradi.
 * - DB ga yoziladi (agent_alerts)
 * - Telegram ga yuboriladi (agar TELEGRAM_AGENTS_BOT_TOKEN bo'lsa)
 * - Socket.IO orqali real-time yuboriladi (agar gateway mavjud bo'lsa)
 */

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM query builder cannot
 *   express: dynamic SQL fragment composition (conditional `target_role = ${role}`
 *   vs `false` literal embedded inside an OR clause), `::jsonb` cast on the
 *   JSON.stringify result, `RETURNING id::text`, and target tables
 *   (agent_alerts, employees.telegram_chat_id lookup) are not present in the
 *   Drizzle schema barrel.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'urgent';

export interface AgentAlert {
  agentName:      string;
  severity:       AlertSeverity;
  title:          string;
  message:        string;
  targetUserId?:  number | null;
  targetRole?:    string | null;     // ceo, cfo, hr_head, ...
  module?:        string | null;
  relatedId?:     string | null;
  actionRequired?: boolean;
  actions?:       Array<{ label: string; action: string; payload?: unknown }>;
}

@Injectable()
export class AgentAlertService {
  private readonly logger = new Logger(AgentAlertService.name);
  private telegramToken?: string;

  constructor(cfg: ConfigService) {
    this.telegramToken = cfg.get<string>('TELEGRAM_AGENTS_BOT_TOKEN') ?? cfg.get<string>('TELEGRAM_NOTIFICATION_BOT_TOKEN');
  }

  async send(alert: AgentAlert): Promise<string | null> {
    try {
      const alertId = await this.insertAlert(alert);
      if (!alertId) return null;
      if (alert.targetUserId) {
        this.sendToTelegram(alert.targetUserId, alert).catch((e) =>
          this.logger.warn(`Telegram send failed: ${(e as Error).message}`),
        );
      }
      return alertId;
    } catch (err) {
      this.logger.error(`Alert send failed: ${(err as Error).message}`);
      return null;
    }
  }

  private async insertAlert(alert: AgentAlert): Promise<string | null> {
    const r = await runQuery<{ id: string }>(sql`
      INSERT INTO agent_alerts
        (agent_name, severity, title, message, target_user_id, target_role,
         module, related_id, action_required, actions)
      VALUES
        (${alert.agentName}, ${alert.severity}, ${alert.title}, ${alert.message},
         ${alert.targetUserId ?? null}, ${alert.targetRole ?? null},
         ${alert.module ?? null}, ${alert.relatedId ?? null},
         ${alert.actionRequired ?? false}, ${JSON.stringify(alert.actions ?? [])}::jsonb)
      RETURNING id::text AS id
    `);
    const alertRow = r.rows[0];
    if (!alertRow) {
      this.logger.warn('Alert insert returned no row');
      return null;
    }
    return alertRow.id;
  }

  /** Severity emoji */
  private icon(severity: AlertSeverity): string {
    switch (severity) {
      case 'urgent':   return '🚨';
      case 'critical': return '🔴';
      case 'warning':  return '⚠️';
      default:         return 'ℹ️';
    }
  }

  private async sendToTelegram(userId: number, alert: AgentAlert): Promise<void> {
    if (!this.telegramToken) return;
    // employees.telegram_chat_id orqali user → chat
    const r = await runQuery<{ telegram_chat_id: string | null }>(sql`
      SELECT telegram_chat_id FROM employees WHERE user_id = ${userId} LIMIT 1
    `);
    const chatId = r.rows[0]?.telegram_chat_id;
    if (!chatId) return;

    const text = `${this.icon(alert.severity)} *${alert.title}*\n\n${alert.message}`;
    try {
      // Native fetch — Telegraf bot instansiyasini chaqirmaymiz (tashqi servisga ulanish kerak emas)
      const url = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
      const body = JSON.stringify({
        chat_id:    chatId,
        text,
        parse_mode: 'Markdown',
      });
      await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    } catch (err) {
      this.logger.warn(`Telegram API call failed: ${(err as Error).message}`);
    }
  }

  /** Foydalanuvchining ogohlantirishlari — shaxsiy yoki rolga mos */
  async listForUser(userId: number, limitOrRole?: number | string, limit = 30) {
    // Orqaga mos kelish: ikkinchi argument raqam bo'lsa — bu limit (eski API)
    let userRole: string | undefined;
    let effectiveLimit = limit;
    if (typeof limitOrRole === 'number') {
      effectiveLimit = limitOrRole;
    } else if (typeof limitOrRole === 'string') {
      userRole = limitOrRole;
    }

    const r = await runQuery<Record<string, unknown>>(sql`
      SELECT id::text AS id, agent_name AS "agentName", severity, title, message,
             module, related_id AS "relatedId", action_required AS "actionRequired",
             actions, is_read AS "isRead", created_at AS "createdAt"
      FROM agent_alerts
      WHERE (
        target_user_id = ${userId}
        OR (
          target_user_id IS NULL
          AND (
            target_role IS NULL
            OR ${userRole ? sql`target_role = ${userRole}` : sql`false`}
          )
        )
      )
      ORDER BY is_read ASC, created_at DESC
      LIMIT ${effectiveLimit}
    `);
    return r.rows;
  }

  async markRead(alertId: string, userId: number): Promise<void> {
    await runQuery(sql`
      UPDATE agent_alerts SET is_read = true, read_at = NOW()
      WHERE id = ${alertId} AND (target_user_id = ${userId} OR target_user_id IS NULL)
    `);
  }
}
