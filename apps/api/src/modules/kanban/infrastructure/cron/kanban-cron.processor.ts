/**
 * kanban-cron.processor.ts — BullMQ 'kanban-cron' navbat workeri.
 *
 * Kanban modulining uchta davriy vazifasini BITTA navbatda, jobType diskriminatori
 * bilan bajaradi (MrpRunProcessor'dagi EOQ_RECALC_ALL/SAFETY_STOCK_REFRESH naqshiga
 * o'xshash — qarang apps/api/src/modules/queue/processors/mrp-run.processor.ts):
 *
 *   - OVERDUE_ESCALATION — muddati o'tgan (due_date < bugun, completed_at NULL)
 *     vazifalar bo'yicha ijrochi+topshiruvchi+kuzatuvchilarga bildirishnoma.
 *     Ilgari: kanban-overdue-escalation.cron.ts (@Cron('0 9 * * *')).
 *   - RECURRING_CARDS — takrorlanuvchi (recurrence_pattern <> 'none'), yakunlangan
 *     kartalarni keyingi sanaga qayta yaratish.
 *     Ilgari: apps/api/src/cron/kanban-recurring.cron.ts (@Cron('0 7 * * *')).
 *   - TT_SLA_ESCALATION — TT (topshiriq/task) turi bor kartalar uchun CC-parity 24h SLA
 *     (owner 2026-07-13), har 30 daqiqada — kanban_cards.sla_hours →
 *     taxonomy_entries.attrs->>'sla_hours' → business_settings default zanjiri.
 *
 * Migratsiya sababi (egasi qarori, 2026-07-13): @nestjs/schedule @Cron in-process
 * ishlaydi — server tushgan payt jadval yo'qoladi. BullMQ repeatable job jadvalni
 * Redis'da saqlaydi (durability/offline-resistance) va navbatga qo'yilgan job Redis'da
 * turadi (worker qayta ko'tarilguncha yo'qolmaydi), xato bersa backoff+retry bilan
 * qayta urinadi (queue.constants.ts backoffDelay). Ish LOGIKASI o'zgarmadi — faqat
 * trigger/execution mexanizmi @Cron'dan BullMQ repeatable job'ga ko'chdi.
 *
 * Repeatable job'lar onModuleInit'da ro'yxatdan o'tkaziladi — BullMQ bir xil
 * job-nomi+pattern/every+tz bilan qayta chaqirishni idempotent qayta ishlaydi (dublikat
 * repeatable entry yaratmaydi), shuning uchun har boot'da/har replikada qayta
 * chaqirish xavfsiz.
 *
 * NOTE: Raw SQL — varchar due_date'ni xavfsiz date'ga cast + NOT EXISTS dedup;
 *   bularni Drizzle query-builder ifodalay olmaydi. See ARCHITECTURE_RULES.md Rule 4.
 *   (escalateOverdue/createRecurringCards ichidagi SQL — asl fayllardan o'zgarishsiz ko'chirilgan.)
 * concurrency: 1 — har uchala job ham qisqa-davrli, parallel ishlash shart emas.
 */
import { Logger, OnModuleInit } from '@nestjs/common';
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { QUEUE_NAMES, backoffDelay } from '../../../queue/queue.constants';

export type KanbanCronJobType = 'OVERDUE_ESCALATION' | 'RECURRING_CARDS' | 'TT_SLA_ESCALATION';

export interface KanbanCronJobData {
  jobType: KanbanCronJobType;
  triggeredBy: string;
}

@Processor(QUEUE_NAMES.KANBAN_CRON, { concurrency: 1 })
export class KanbanCronProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(KanbanCronProcessor.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.KANBAN_CRON) private readonly kanbanCronQueue: Queue,
  ) {
    super();
  }

  /**
   * BullMQ repeatable job'larni ro'yxatdan o'tkazish (jadval Redis'da saqlanadi).
   * Redis vaqtincha mavjud bo'lmasa (dev muhiti, Q-44 muhit-xatosi) — catch qilib
   * log yoziladi, app boot'i to'xtamaydi; navbatdagi restart'da qayta urinilgan bo'ladi.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.kanbanCronQueue.add(
        'overdue-escalation',
        { jobType: 'OVERDUE_ESCALATION', triggeredBy: 'bullmq-repeat' } satisfies KanbanCronJobData,
        { repeat: { pattern: '0 9 * * *', tz: 'Asia/Tashkent' } },
      );
      await this.kanbanCronQueue.add(
        'recurring-cards',
        { jobType: 'RECURRING_CARDS', triggeredBy: 'bullmq-repeat' } satisfies KanbanCronJobData,
        { repeat: { pattern: '0 7 * * *', tz: 'Asia/Tashkent' } },
      );
      // TT (topshiriq/task) SLA eskalatsiya (owner 2026-07-13) — CC'ning 30-daqiqalik
      // inbox-SLA poll kadransiga mos (cc-sla.cron.ts markInboxOverdue()).
      await this.kanbanCronQueue.add(
        'tt-sla-escalation',
        { jobType: 'TT_SLA_ESCALATION', triggeredBy: 'bullmq-repeat' } satisfies KanbanCronJobData,
        { repeat: { every: 30 * 60 * 1000 } },
      );
      this.logger.log(
        "[kanban-cron] repeatable job'lar ro'yxatdan o'tdi: overdue-escalation (09:00), recurring-cards (07:00) Asia/Tashkent, tt-sla-escalation (har 30 daqiqa)",
      );
    } catch (err) {
      this.logger.error(`[kanban-cron] repeatable job ro'yxatga olishda xato (Redis mavjudmi?): ${String(err)}`);
    }
  }

  async process(job: Job<KanbanCronJobData>): Promise<void> {
    const delay = backoffDelay(job.attemptsMade);
    this.logger.debug(`[kanban-cron] Job #${job.id} type=${job.data.jobType} backoff=${delay}ms`);

    try {
      if (job.data.jobType === 'OVERDUE_ESCALATION') {
        await this.escalateOverdue();
      } else if (job.data.jobType === 'RECURRING_CARDS') {
        await this.createRecurringCards();
      } else if (job.data.jobType === 'TT_SLA_ESCALATION') {
        await this.escalateTtSla();
      }
      this.logger.log(`[kanban-cron] Job #${job.id} muvaffaqiyatli yakunlandi`);
    } catch (err) {
      this.logger.error(`[kanban-cron] Job #${job.id} xato: ${String(err)}`);
      throw err;
    }
  }

  // ===== OVERDUE_ESCALATION — kanban-overdue-escalation.cron.ts'dan ko'chirilgan, o'zgarishsiz =====

  /**
   * Muddati o'tgan (due_date < bugun, completed_at NULL) vazifalarni topib,
   * ijrochi + topshiruvchiga bildirishnoma yuborish. Bir karta = kuniga bir bildirishnoma.
   */
  private async escalateOverdue(): Promise<void> {
    try {
      const r = await runQuery<{
        id: number; title: string | null; owner_user_id: number | null; assigner_user_id: number | null;
      }>(sql`
        SELECT c.id, c.title, c.owner_user_id, c.assigner_user_id
        FROM kanban_cards c
        WHERE c.completed_at IS NULL
          AND c.due_date ~ '^\\d{4}-\\d{2}-\\d{2}'
          AND substring(c.due_date FROM 1 FOR 10)::date < CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.reference_type = 'kanban_card'
              AND n.reference_id = c.id
              AND n.type = 'kanban_overdue'
              AND n.created_at::date = CURRENT_DATE
          )
      `);
      if (r.rows.length === 0) return;
      this.logger.warn(`Kanban eskalatsiya: ${r.rows.length} vazifa muddati o'tdi`);

      // Pattern 2: har qatorning bildirishnomalari mustaqil — parallel.
      await Promise.all(r.rows.map(async (row) => {
        const t = (row.title ?? 'Vazifa').slice(0, 80);
        if (row.owner_user_id) {
          await this.notify(row.owner_user_id, row.id, 'kanban_overdue',
            'Vazifa muddati o\'tdi',
            `«${t}» vazifasi muddati o'tib ketdi. Iltimos, bajaring yoki muddatni yangilang.`,
            'high');
        }
        if (row.assigner_user_id && row.assigner_user_id !== row.owner_user_id) {
          await this.notify(row.assigner_user_id, row.id, 'kanban_overdue',
            'Topshirgan vazifangiz muddati o\'tdi',
            `«${t}» vazifasi belgilangan muddatda bajarilmadi.`,
            'normal');
        }
        // Vizyon §15 #72: kuzatuvchilarga FAQAT muhim hodisada (muddat o'tishi) xabar.
        // owner/assigner yuqorida allaqachon xabar oldi — ular ro'yxatdan chiqariladi;
        // oddiy ustun ko'chirish esa umuman xabar bermaydi ("faqat muhim hodisa").
        const obs = await runQuery<{ user_id: number }>(sql`
          SELECT user_id FROM kanban_observers WHERE card_id = ${String(row.id)}
        `);
        await Promise.all(obs.rows
          .filter((o) => o.user_id !== row.owner_user_id && o.user_id !== row.assigner_user_id)
          .map((o) => this.notify(
            o.user_id, row.id, 'kanban_overdue',
            'Kuzatayotgan vazifangiz muddati o\'tdi',
            `«${t}» vazifasi belgilangan muddatda bajarilmadi.`,
            'normal')));
      }));
    } catch (e) {
      this.logger.error(`escalateOverdue: ${(e as Error).message}`);
    }
  }

  private async notify(
    userId: number, cardId: number, type: string, title: string, body: string,
    priority: 'low' | 'normal' | 'high' | 'urgent',
  ): Promise<void> {
    await runQuery(sql`
      INSERT INTO notifications
        (user_id, type, title, body, is_read, reference_id, reference_type, priority, created_at)
      VALUES
        (${userId}, ${type}, ${title}, ${body}, false, ${cardId}, 'kanban_card', ${priority}, NOW())
    `);
  }

  // ===== TT_SLA_ESCALATION — owner 2026-07-13, CC 24h-SLA mexanizmiga mos (yangi) =====

  /**
   * TT (topshiriq/task) tur-governance SLA — owner 2026-07-13 (chat): "TT majburiy maydon +
   * 24 soatlik eskalatsiya CC shablon qoidalariga mos kelishi kerak" — CC'ning haqiqiy 24h SLA
   * mexanizmini (cc_document_templates.inbox_sla_hours, cc-sla.cron.ts markInboxOverdue() — har
   * 30 daqiqada tekshiradi) qayta ishlatib, yuqoridagi umumiy kunlik-09:00 escalateOverdue()
   * (due_date-asosli) ustiga QO'SHIMCHA (Q-46 — mavjud xatti-harakat o'zgarmaydi). Faqat
   * task_type BOR kartalar (TT kartalar) tekshiriladi; oddiy kanban kartalar (task_type=NULL)
   * hamon escalateOverdue() bilan qamrab olinadi.
   *
   * Effektiv SLA (soat) zanjiri: kanban_cards.sla_hours (karta override) →
   * taxonomy_entries.attrs->>'sla_hours' (tur standarti, category='kanban_task_type') →
   * business_settings 'kanban.tt_task_sla_hours_default' (global default, CRUD orqali
   * sozlanadi — Q-40, hech qanday raqam kodga hardcode qilinmagan).
   *
   * Dedup: yangi "yuborilganmi" ustuni QO'SHILMAYDI — escalateOverdue() bilan bir xil
   * NOT EXISTS(notifications) konvensiyasi (bu safar kunlik emas — bir marta SLA buzilgani
   * aniqlansa, bitta 'kanban_tt_sla_overdue' bildirishnoma umrbod kifoya, karta bajarilguncha).
   */
  private async escalateTtSla(): Promise<void> {
    try {
      const r = await runQuery<{
        id: number; title: string | null; owner_user_id: number | null; assigner_user_id: number | null;
      }>(sql`
        WITH tt_sla AS (
          SELECT c.id, c.title, c.owner_user_id, c.assigner_user_id, c.created_at,
                 COALESCE(
                   c.sla_hours,
                   (te.attrs ->> 'sla_hours')::numeric,
                   (SELECT value_num FROM business_settings
                     WHERE setting_key = 'kanban.tt_task_sla_hours_default' AND is_active = true)
                 ) AS effective_sla_hours
          FROM kanban_cards c
          LEFT JOIN taxonomy_entries te
            ON te.category = 'kanban_task_type' AND te.code = c.task_type AND te.is_active = true
          WHERE c.task_type IS NOT NULL
            AND c.completed_at IS NULL
            AND c.deleted_at IS NULL
        )
        SELECT id, title, owner_user_id, assigner_user_id
        FROM tt_sla
        WHERE effective_sla_hours IS NOT NULL
          AND created_at + (effective_sla_hours || ' hours')::interval < NOW()
          AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.reference_type = 'kanban_card'
              AND n.reference_id = tt_sla.id
              AND n.type = 'kanban_tt_sla_overdue'
          )
      `);
      if (r.rows.length === 0) return;
      this.logger.warn(`Kanban TT SLA: ${r.rows.length} vazifa SLA muddati o'tdi`);

      // Pattern 2: har qatorning bildirishnomalari mustaqil — parallel.
      await Promise.all(r.rows.map(async (row) => {
        const t = (row.title ?? 'Vazifa').slice(0, 80);
        if (row.owner_user_id) {
          await this.notify(row.owner_user_id, row.id, 'kanban_tt_sla_overdue',
            'TT vazifa SLA muddati o\'tdi',
            `«${t}» vazifasi belgilangan SLA muddatida bajarilmadi. Iltimos, ko'rib chiqing.`,
            'high');
        }
        if (row.assigner_user_id && row.assigner_user_id !== row.owner_user_id) {
          await this.notify(row.assigner_user_id, row.id, 'kanban_tt_sla_overdue',
            'Topshirgan TT vazifangiz SLA muddati o\'tdi',
            `«${t}» vazifasi belgilangan SLA muddatida bajarilmadi.`,
            'normal');
        }
      }));
    } catch (e) {
      this.logger.error(`escalateTtSla: ${(e as Error).message}`);
    }
  }

  // ===== RECURRING_CARDS — apps/api/src/cron/kanban-recurring.cron.ts'dan ko'chirilgan, o'zgarishsiz =====

  /**
   * Takrorlanuvchi kanban kartalarni qayta yaratadi.
   * recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'none'
   * Karta yakunlanganda (completed_at IS NOT NULL) keyingi sana hisoblanadi
   * va yangi nusxa yaratiladi (completed_at = NULL).
   */
  private async createRecurringCards(): Promise<void> {
    const processed: string[] = [];
    const errors: string[]    = [];

    try {
      // Takrorlanuvchi, yakunlangan kartalar
      const rows = await runQuery<{
        id: string; title: string; description: string | null;
        column_id: string; board_id: string; priority: string;
        owner_user_id: string | null; estimated_time: number | null;
        recurrence_pattern: string; recurrence_end_date: string | null;
        due_date: string | null;
      }>(sql`
        SELECT id, title, description, column_id, board_id, priority,
               owner_user_id, estimated_time,
               recurrence_pattern, recurrence_end_date, due_date
        FROM kanban_cards
        WHERE recurrence_pattern <> 'none'
          AND completed_at IS NOT NULL
          AND deleted_at IS NULL
          AND (recurrence_end_date IS NULL OR recurrence_end_date >= CURRENT_DATE)
        LIMIT 200
      `);

      for (const card of rows.rows) {
        try {
          const nextDue = this._nextDueDate(card.due_date, card.recurrence_pattern);
          if (!nextDue) continue;

          // Allaqachon mavjud nusxani tekshirish (bir xil title + due_date + board)
          const exists = await runQuery<{ cnt: number }>(sql`
            SELECT COUNT(*)::int AS cnt FROM kanban_cards
            WHERE title = ${card.title}
              AND board_id = ${card.board_id}
              AND due_date = ${nextDue}
              AND deleted_at IS NULL
              AND completed_at IS NULL
          `);
          if (Number(exists.rows[0]?.cnt ?? 0) > 0) continue;

          await runQuery(sql`
            INSERT INTO kanban_cards
              (title, description, column_id, board_id, priority,
               owner_user_id, estimated_time, recurrence_pattern,
               recurrence_end_date, due_date, sort_order, created_at, updated_at)
            SELECT
              ${card.title}, ${card.description ?? null},
              ${card.column_id}, ${card.board_id}, ${card.priority},
              ${card.owner_user_id ?? null}, ${card.estimated_time ?? null},
              ${card.recurrence_pattern}, ${card.recurrence_end_date ?? null},
              ${nextDue}::date,
              COALESCE((SELECT MAX(sort_order) + 1 FROM kanban_cards WHERE column_id = ${card.column_id} AND deleted_at IS NULL), 0),
              NOW(), NOW()
          `);
          processed.push(card.id);
        } catch (rowErr) {
          errors.push(`${card.id}: ${String(rowErr)}`);
        }
      }

      this.logger.log(`✅ KanbanRecurring: yaratildi=${processed.length}, xato=${errors.length}`);
    } catch (err) {
      this.logger.error(`❌ KanbanRecurring xato: ${String(err)}`);
    }
  }

  private _nextDueDate(dueDate: string | null, pattern: string): string | null {
    const d = dueDate ? new Date(dueDate) : new Date();
    switch (pattern) {
      case 'daily':   d.setDate(d.getDate() + 1);   break;
      case 'weekly':  d.setDate(d.getDate() + 7);   break;
      case 'monthly': d.setMonth(d.getMonth() + 1); break;
      default:        return null;
    }
    return d.toISOString().split('T')[0];
  }
}
