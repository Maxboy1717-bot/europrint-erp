/**
 * @module agent-alert-notification.listener
 * @description Agent-signallarini bildirishnomaga ulaydi (golden-thread). Tekshiruv (2026-06-27):
 *   `finance.fraud_suspected` va `hr.low_performance` eventlari emit qilinardi, lekin LISTENER YO'Q edi —
 *   signal hech kimga yetib bormasdi. Endi tegishli rollarga `notifications` yoziladi.
 *
 *   AgentEventBus payloadni o'raydi: { source, eventName, payload, timestamp }.
 * @layer Listener (Agents)
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

interface Wrapped<T> { source?: string; eventName?: string; payload?: T; timestamp?: number }

@Injectable()
export class AgentAlertNotificationListener {
  private readonly logger = new Logger(AgentAlertNotificationListener.name);

  @OnEvent('finance.fraud_suspected')
  async onFraud(event: Wrapped<{ count?: number }>): Promise<void> {
    const count = event?.payload?.count ?? 0;
    await this.notifyRoles(['super_admin', 'director'], 'finance_fraud_alert',
      'Shubhali moliyaviy operatsiya',
      `${count} ta shubhali tranzaksiya aniqlandi — zudlik bilan tekshiring.`, 'urgent');
  }

  @OnEvent('hr.low_performance')
  async onLowPerformance(event: Wrapped<{ employeeId?: number; score?: number }>): Promise<void> {
    const { employeeId, score } = event?.payload ?? {};
    if (!employeeId) return;
    await this.notifyRoles(['hr_manager', 'admin', 'director'], 'hr_low_performance',
      'Past samaradorlik ogohlantirishi',
      `Xodim #${employeeId} samaradorlik balli past (${score ?? '-'}). Ko'rib chiqing.`, 'high');
  }

  private async notifyRoles(
    roles: string[], type: string, title: string, body: string,
    priority: 'low' | 'normal' | 'high' | 'urgent',
  ): Promise<void> {
    try {
      const roleList = sql.join(roles.map(r => sql`${r}`), sql`, `);
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO notifications
          (user_id, type, title, body, is_read, priority, created_at)
        SELECT u.id, ${type}, ${title}, ${body}, FALSE, ${priority}, NOW()
        FROM users u
        WHERE u.role IN (${roleList}) AND u.is_active = TRUE AND u.deleted_at IS NULL
        RETURNING id
      `);
      this.logger.log(`${type}: ${r.rows.length} bildirishnoma yuborildi (${roles.join('/')})`);
    } catch (e) {
      this.logger.warn(`notifyRoles(${type}): ${(e as Error).message}`);
    }
  }
}
