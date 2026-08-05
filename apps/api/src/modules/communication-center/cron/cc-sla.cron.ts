/**
 * Communication Center — Cron jobs
 *
 *   Har 30 daqiqada — kiruvchi savat 24h SLA tekshiruvi + escalation + delegation cleanup
 *   Har soat        — takrorlanuvchi hujjatlar (cron_expression bo'yicha, hozircha placeholder)
 *                     + shablon archive_after_days arxivlash (owner 2026-07-13)
 *                     + 90-kunlik eskirgan-qoralama arxivlash (owner 2026-07-13)
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
import { CcRetentionService } from '../application/cc-retention.service';
import { CcOrgResolverService } from '../application/cc-org-resolver.service';
import { getBusinessSettingNumber } from '../../../shared/config/business-settings.reader';

@Injectable()
export class CcSlaCron {
  private readonly logger = new Logger(CcSlaCron.name);

  constructor(
    private readonly retention: CcRetentionService,
    private readonly orgResolver: CcOrgResolverService,
  ) {}

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
      await this.remindOverdue48h();       // 48 soat o'tgan hujjatlar uchun 24h-gated takroriy eslatma (20-cc#30)
      await this.escalateApprovals();
      await this.expireDelegations();
    } catch (e) {
      this.logger.error(`runEvery30Min: ${(e as Error).message}`);
    }
  }

  /**
   * Har soatning 5-daqiqasida:
   *  1. Takrorlanuvchi hujjatlarni tekshirish (is_recurring) — hozircha placeholder.
   *     (To'liq cron-expression matching keyingi versiyada.)
   *  2. Shablon darajasidagi archive_after_days (cc_document_templates) — tasdiqlangan
   *     hujjatlarni muddati kelganda arxivlash (owner 2026-07-13).
   *  3. 90 kunlik (business_settings 'cc.stale_draft_archive_days') — uzoq DRAFT holatda
   *     qolgan hujjatlarni arxivlash (owner 2026-07-13).
   */
  @Cron('5 * * * *')
  async runEveryHour(): Promise<void> {
    try {
      await this.spawnRecurringDocuments();
      await this.applyTemplateArchival();
      await this.archiveStaleDrafts();
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
  /**
   * 20-cc#30 — egasi qarori (2026-07-11 chat): 48-soatlik AVTO-RAD ETISH olib
   * tashlandi (hujjatni majburiy 'rejected' qilib qo'yish noto'g'ri edi — vizyon
   * "HR notify + 24h repeat reminder" so'ragan, "avtomatik rad etish" emas).
   * Hujjat workflow_state/basket_state O'ZGARMAYDI — faqat 24 soatda BIR MARTA
   * (overdue_reminder_sent_at gate) yuboruvchi + pending approver'larga takroriy
   * "hali ko'rib chiqilmadi" eslatma yuboriladi, muddat cheksiz davom etadi.
   */
  private async remindOverdue48h(): Promise<void> {
    const thresholdHours = await getBusinessSettingNumber('cc.overdue_reminder_threshold_hours', 48);
    const repeatHours     = await getBusinessSettingNumber('cc.overdue_reminder_repeat_hours', 24);
    const r = await runQuery<{
      id: string; sender_user_id: number;
    }>(sql`
      SELECT id::text AS id, sender_user_id
      FROM cc_documents
      WHERE basket_state = 'inbox'
        AND is_inbox_overdue = true
        AND basket_entered_at + (${thresholdHours} || ' hours')::interval < NOW()
        AND workflow_state NOT IN ('rejected', 'cancelled', 'approved')
        AND (overdue_reminder_sent_at IS NULL OR overdue_reminder_sent_at < NOW() - (${repeatHours} || ' hours')::interval)
    `);

    if (r.rows.length > 0) {
      this.logger.warn(`${thresholdHours}h+ overdue reminder: ${r.rows.length} hujjatga takroriy eslatma`);
      const overdueIds = r.rows.map(row => row.id);

      await runQuery(sql`
        UPDATE cc_documents SET overdue_reminder_sent_at = NOW()
        WHERE id = ANY(${overdueIds}::uuid[])
      `);

      // Pending approvallarga alohida eslatma — kim javob berishi kerakligini bilsin.
      const approvers = await runQuery<{ document_id: string; approver_user_id: number }>(sql`
        SELECT document_id::text AS document_id, approver_user_id
        FROM cc_approvals
        WHERE document_id = ANY(${overdueIds}::uuid[]) AND state = 'pending'
      `);

      await Promise.all(r.rows.map(async (row) => {
        await runQuery(sql`
          INSERT INTO cc_audit_trail (document_id, action, performed_by_user_id, comment)
          VALUES (${row.id}, 'overdue_reminder', NULL,
                  ${`${thresholdHours} soat SLA chegarasi oshdi — takroriy eslatma yuborildi (avto-rad etish YO'Q)`})
        `);
        await this.pushNotification({
          userId:    row.sender_user_id,
          docId:     row.id,
          type:      'overdue_reminder',
          titleUz:   'Hujjat hali ko\'rib chiqilmadi',
          titleRu:   'Документ всё ещё не рассмотрен',
          messageUz: `Hujjatingiz ${thresholdHours} soatdan ortiq ko'rib chiqilmayapti. Mas'ul shaxsga yana eslatma yuborildi.`,
          messageRu: `Ваш документ не рассмотрен более ${thresholdHours} часов. Ответственному отправлено повторное напоминание.`,
          priority:  'high',
        });
      }));

      await Promise.all(approvers.rows.map((row) => this.pushNotification({
        userId:    row.approver_user_id,
        docId:     row.document_id,
        type:      'overdue_reminder_approver',
        titleUz:   'Sizga muddati o\'tgan hujjat kutmoqda',
        titleRu:   'Вас ожидает просроченный документ',
        messageUz: `${thresholdHours} soatdan ortiq javob kutilayotgan hujjat bor — iltimos ko'rib chiqing.`,
        messageRu: `Есть документ, ожидающий ответа более ${thresholdHours} часов — пожалуйста, рассмотрите.`,
        priority:  'high',
      })));
    }
  }

  /**
   * Item #148: this previously only flipped `cc_approvals.state = 'escalated'`
   * and wrote an audit-trail row — nobody was ever notified or re-routed, so
   * "escalated" documents silently sat with the same non-responsive approver
   * forever. Now resolves the escalation target (the missed approver's own
   * manager, via the same CcOrgResolverService used for workflow-step
   * approval resolution) and notifies both the missed approver and their
   * manager — same pushNotification mechanism already used by
   * sendOverdueReminders() above.
   */
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
      // Pattern 2: per-row audit + notify + re-route are independent — parallel.
      await Promise.all(r.rows.map(async (row) => {
        await runQuery(sql`
          INSERT INTO cc_audit_trail (document_id, action, performed_by_user_id, comment)
          VALUES (${row.document_id}, 'escalated', ${row.approver_user_id},
                  ${`Step ${row.step_order} muddati o'tdi — eskalatsiya`})
        `);

        await this.pushNotification({
          userId:    row.approver_user_id,
          docId:     row.document_id,
          type:      'approval_escalated_from',
          titleUz:   'Tasdiqlash muddati o\'tdi — eskalatsiya qilindi',
          titleRu:   'Срок утверждения истёк — эскалировано',
          messageUz: `${row.step_order}-bosqich tasdig\'i muddatida bajarilmadi. Rahbaringizga xabar berildi.`,
          messageRu: `Утверждение на этапе ${row.step_order} не выполнено в срок. Ваш руководитель уведомлён.`,
          priority:  'urgent',
        });

        const managerResult = await this.orgResolver.resolveApprover('MANAGER_OF_SENDER', row.approver_user_id);
        if (!managerResult.ok) {
          this.logger.warn(`escalateApprovals: approval=${row.id} approver=${row.approver_user_id} — manager topilmadi, faqat approver'ga xabar berildi (${managerResult.error.message})`);
          return;
        }
        if (managerResult.data === row.approver_user_id) return;
        await this.pushNotification({
          userId:    managerResult.data,
          docId:     row.document_id,
          type:      'approval_escalated_to',
          titleUz:   'Xodimingizning tasdiqlash muddati o\'tdi',
          titleRu:   'У вашего сотрудника истёк срок утверждения',
          messageUz: `${row.step_order}-bosqich tasdig\'i muddatida bajarilmadi — ko\'rib chiqishingiz so\'raladi.`,
          messageRu: `Утверждение на этапе ${row.step_order} не выполнено в срок — просим рассмотреть.`,
          priority:  'urgent',
        });
      }));
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

  /**
   * Owner 2026-07-13: cc_document_templates.archive_after_days (kun, 18 shablonda mavjud
   * lekin hozirgacha hech qanday kod o'qimasdi) — endi haqiqatan qo'llaniladi. Tasdiqlangan
   * (workflow_state='approved') hujjat shablonining archive_after_days muddatidan ko'proq
   * vaqt oldin yakunlangan bo'lsa (updated_at — approve paytida transition() yangilaydi;
   * cc-stats.service.ts ham shu ustunni "approved sana" sifatida ishlatadi) va hali
   * arxivlanmagan bo'lsa (archived_at IS NULL) — mavjud arxiv mexanizmi
   * (cc-retention.service.archiveWithRetention, Batch 5 Item 3) orqali arxivlanadi.
   * Dublikat yo'q (Q-46) — arxivlash faqat shu bitta joyda amalga oshadi.
   */
  private async applyTemplateArchival(): Promise<void> {
    const r = await runQuery<{ id: string }>(sql`
      SELECT d.id::text AS id
      FROM cc_documents d
      JOIN cc_document_templates t ON t.id = d.template_id
      WHERE d.workflow_state = 'approved'
        AND d.archived_at IS NULL
        AND t.archive_after_days IS NOT NULL
        AND d.updated_at + (t.archive_after_days || ' days')::interval < NOW()
    `);
    if (r.rows.length === 0) return;
    this.logger.log(`Shablon archive_after_days: ${r.rows.length} hujjat arxivlanmoqda`);
    // Pattern 2: har bir hujjat arxivi mustaqil — parallel
    await Promise.all(r.rows.map(async (row) => {
      const res = await this.retention.archiveWithRetention(row.id);
      if (!res.ok) this.logger.warn(`Shablon arxivi ${row.id}: ${res.error.message}`);
    }));
  }

  /**
   * Owner 2026-07-13: yangi qoida — DRAFT holatida uzoq (hech qachon yuborilmagan) qolgan
   * hujjatlar "eskirgan qoralama" sifatida arxivlanadi (O'CHIRILMAYDI — faqat mavjud arxiv
   * mexanizmi bilan archived_at o'rnatiladi, additive/soft). Muddat business_settings
   * 'cc.stale_draft_archive_days' dan o'qiladi (default 90 — Q-40, chatda raqam hardcode
   * qilinmaydi, CRUD orqali sozlanadi).
   */
  private async archiveStaleDrafts(): Promise<void> {
    const staleDays = await getBusinessSettingNumber('cc.stale_draft_archive_days', 90);
    const r = await runQuery<{ id: string }>(sql`
      SELECT id::text AS id
      FROM cc_documents
      WHERE workflow_state = 'draft'
        AND archived_at IS NULL
        AND created_at < NOW() - (${staleDays} || ' days')::interval
    `);
    if (r.rows.length === 0) return;
    this.logger.log(`Eskirgan qoralama (>${staleDays} kun): ${r.rows.length} hujjat arxivlanmoqda`);
    await Promise.all(r.rows.map(async (row) => {
      const res = await this.retention.archiveWithRetention(row.id);
      if (!res.ok) this.logger.warn(`Eskirgan qoralama arxivi ${row.id}: ${res.error.message}`);
    }));
  }

  // ─────────────────────────────────────────────────────────────────────
  private async pushNotification(args: {
    userId: number; docId: string; type: string;
    titleUz: string; titleRu: string;
    messageUz: string; messageRu: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<void> {
    // cc_notifications is a VIEW over `notifications` whose NOT NULL cols are title + body — the insert
    // omitted both (only title_uz/message_uz) -> 23502. Supply title := titleUz, body := messageUz.
    await runQuery(sql`
      INSERT INTO cc_notifications
        (user_id, document_id, type, priority, title_uz, title_ru, message_uz, message_ru, title, body)
      VALUES
        (${args.userId}, ${args.docId}, ${args.type}, ${args.priority ?? 'normal'},
         ${args.titleUz}, ${args.titleRu}, ${args.messageUz}, ${args.messageRu}, ${args.titleUz}, ${args.messageUz})
    `);
  }
}
