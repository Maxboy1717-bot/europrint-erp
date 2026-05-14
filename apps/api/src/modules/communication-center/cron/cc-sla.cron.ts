/**
 * Communication Center — Cron jobs
 *
 *   Har 30 daqiqada — kiruvchi savat 24h SLA tekshiruvi + escalation + delegation cleanup
 *   Har soat        — takrorlanuvchi hujjatlar (cron_expression bo'yicha)
 */

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM query builder cannot
 *   express: UPDATE...FROM join (`UPDATE cc_documents d ... FROM cc_document_templates t`),
 *   computed interval arithmetic from a column value (`(t.inbox_sla_hours || ' hours')::interval`),
 *   UPDATE...RETURNING multiple columns to drive notifications, dynamic UUID
 *   array `${rejectedIds}::uuid[]` cast for `= ANY(...)` bulk filter, and
 *   `NOW()` / `INTERVAL '48 hours'` server-side date arithmetic. Target tables
 *   (cc_documents, cc_approvals, cc_delegations, cc_audit_trail,
 *   cc_notifications, cc_document_templates) are not present in the Drizzle
 *   schema barrel.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { getCcGateway } from '../presentation/cc.gateway';

@Injectable()
export class CcSlaCron {
  private readonly logger = new Logger(CcSlaCron.name);

  /**
   * Har 30 daqiqada:
   *  1. Kiruvchi savat 24h SLA muddati o'tganlarni belgilash
   *  2. Eskalatsiya: pending approval'lar uchun deadline o'tganda eslatma yuboriladi
   *  3. Delegatsiya: ends_at o'tganlarni avtomatik faolsizlashtirish
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async runEvery30Min(): Promise<void> {
    try {
      await this.markInboxOverdue();
      await this.autoRejectOverdue48h();   // 48 soat o'tgan hujjatlarni majburiy rad etish
      await this.escalateApprovals();
      await this.expireDelegations();
    } catch (e) {
      this.logger.error(`runEvery30Min: ${(e as Error).message}`);
    }
  }

  /**
   * Har soatning 5-daqiqasida — takrorlanuvchi hujjatlarni tekshirish.
   * (To'liq cron-expression matching keyingi versiyada — hozir faqat is_recurring tekshiruvi.)
   */
  @Cron('5 * * * *')
  async runEveryHour(): Promise<void> {
    try {
      await this.spawnRecurringDocuments();
    } catch (e) {
      this.logger.error(`runEveryHour: ${(e as Error).message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  private async markInboxOverdue(): Promise<void> {
    // SLA: basket_entered_at + tmpl.inbox_sla_hours < NOW()
    const r = await runQuery<{
      id: string; basket_owner_user_id: number | null; sender_user_id: number;
    }>(sql`
      UPDATE cc_documents d
      SET is_inbox_overdue = true, updated_at = NOW()
      FROM cc_document_templates t
      WHERE d.template_id = t.id
        AND d.basket_state = 'inbox'
        AND d.is_inbox_overdue = false
        AND d.basket_entered_at + (t.inbox_sla_hours || ' hours')::interval < NOW()
      RETURNING d.id::text AS id, d.basket_owner_user_id, d.sender_user_id
    `);
    if (r.rows.length > 0) {
      this.logger.warn(`Inbox SLA: ${r.rows.length} hujjat muddati o'tdi`);
      const gw = getCcGateway();
      if (!gw) this.logger.warn('CcGateway not initialized — WebSocket SLA notifications skipped');
      // Pattern 2: each row's audit + notification writes are independent — fan out in parallel
      await Promise.all(r.rows.map(async (row) => {
        await runQuery(sql`
          INSERT INTO cc_audit_trail (document_id, action, performed_by_user_id, comment)
          VALUES (${row.id}, 'inbox_24h_overdue', NULL, '24 soat SLA muddati o''tdi')
        `);
        if (row.basket_owner_user_id) {
          await this.pushNotification({
            userId:  row.basket_owner_user_id,
            docId:   row.id,
            type:    'inbox_24h_warning',
            titleUz: 'Kiruvchi savat — muddat o\'tdi',
            titleRu: 'Входящая корзина — срок истёк',
            messageUz: 'Hujjat 24 soatdan ko\'p kiruvchi savatda turibdi. Iltimos, ko\'rib chiqing.',
            messageRu: 'Документ находится во входящей корзине более 24 часов. Просим рассмотреть.',
            priority: 'high',
          });
          gw?.emitToUser(row.basket_owner_user_id, 'inbox:overdue', { documentId: row.id });
        }
        await this.pushNotification({
          userId:  row.sender_user_id,
          docId:   row.id,
          type:    'overdue',
          titleUz: 'Sizning hujjatingiz uzoq kutilmoqda',
          titleRu: 'Ваш документ долго не рассмотрен',
          messageUz: 'Yuborgan hujjatingiz 24 soatdan ko\'p ko\'rib chiqilmadi.',
          messageRu: 'Ваш документ не рассматривается более 24 часов.',
          priority: 'normal',
        });
      }));
    }
  }

  // 48 soat o'tgan hujjatlarni tizim tomonidan majburiy rad etish
  private async autoRejectOverdue48h(): Promise<void> {
    const r = await runQuery<{
      id: string; sender_user_id: number;
    }>(sql`
      UPDATE cc_documents
      SET workflow_state = 'rejected',
          basket_state   = 'outbox',
          updated_at     = NOW()
      WHERE basket_state = 'inbox'
        AND is_inbox_overdue = true
        AND basket_entered_at + INTERVAL '48 hours' < NOW()
        AND workflow_state NOT IN ('rejected', 'cancelled', 'approved')
      RETURNING id::text AS id, sender_user_id
    `);

    if (r.rows.length > 0) {
      this.logger.warn(`48h auto-reject: ${r.rows.length} hujjat avtomatik rad etildi`);
      const rejectedIds = r.rows.map(row => row.id);

      // Pending approvallarni eskalatsiya holatiga o'tkazish
      await runQuery(sql`
        UPDATE cc_approvals SET state = 'escalated', updated_at = NOW()
        WHERE document_id = ANY(${rejectedIds}::uuid[]) AND state = 'pending'
      `);

      // Pattern 2: per-row audit + notification writes fan out in parallel
      await Promise.all(r.rows.map(async (row) => {
        await runQuery(sql`
          INSERT INTO cc_audit_trail (document_id, action, performed_by_user_id, comment)
          VALUES (${row.id}, 'auto_rejected_48h', NULL,
                  '48 soat SLA chegarasi oshdi — tizim tomonidan avtomatik rad etildi')
        `);
        await this.pushNotification({
          userId:    row.sender_user_id,
          docId:     row.id,
          type:      'auto_rejected',
          titleUz:   'Hujjat avtomatik rad etildi',
          titleRu:   'Документ автоматически отклонён',
          messageUz: 'Hujjatingiz 48 soat davomida ko\'rib chiqilmadi va tizim tomonidan rad etildi.',
          messageRu: 'Ваш документ не рассмотрен за 48 часов и автоматически отклонён системой.',
          priority:  'urgent',
        });
      }));
    }
  }

  private async escalateApprovals(): Promise<void> {
    // pending approvals where deadline_at < NOW() AND escalated_at IS NULL
    const r = await runQuery<{
      id: string; document_id: string; approver_user_id: number; step_order: number;
    }>(sql`
      UPDATE cc_approvals
      SET state = 'escalated', escalated_at = NOW(), updated_at = NOW()
      WHERE state = 'pending'
        AND deadline_at IS NOT NULL
        AND deadline_at < NOW()
        AND escalated_at IS NULL
      RETURNING id::text AS id, document_id::text AS document_id, approver_user_id, step_order
    `);
    if (r.rows.length > 0) {
      this.logger.warn(`Escalated: ${r.rows.length} approval`);
      // Pattern 2: per-row audit inserts are independent — run in parallel
      await Promise.all(r.rows.map((row) => runQuery(sql`
        INSERT INTO cc_audit_trail (document_id, action, performed_by_user_id, comment)
        VALUES (${row.document_id}, 'escalated', ${row.approver_user_id},
                ${`Step ${row.step_order} muddati o'tdi — eskalatsiya`})
      `)));
    }
  }

  private async expireDelegations(): Promise<void> {
    const r = await runQuery<{ id: string }>(sql`
      UPDATE cc_delegations
      SET is_active = false
      WHERE is_active = true AND ends_at < NOW()
      RETURNING id::text AS id
    `);
    if (r.rows.length > 0) {
      this.logger.log(`Delegations expired: ${r.rows.length}`);
    }
  }

  private async spawnRecurringDocuments(): Promise<void> {
    // Soddalashtirilgan implementatsiya — `is_recurring=true` shablonlar uchun
    // har soatda bitta marta sun'iy ravishda yaratish o'tkazib yuboriladi.
    // To'liq cron-expression matching kelajakda qo'shiladi.
    // (Hozir hech narsa qilmaydi; placeholder)
  }

  // ─────────────────────────────────────────────────────────────────────
  private async pushNotification(args: {
    userId: number; docId: string; type: string;
    titleUz: string; titleRu: string;
    messageUz: string; messageRu: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<void> {
    await runQuery(sql`
      INSERT INTO cc_notifications
        (user_id, document_id, type, priority, title_uz, title_ru, message_uz, message_ru)
      VALUES
        (${args.userId}, ${args.docId}, ${args.type}, ${args.priority ?? 'normal'},
         ${args.titleUz}, ${args.titleRu}, ${args.messageUz}, ${args.messageRu})
    `);
  }
}
