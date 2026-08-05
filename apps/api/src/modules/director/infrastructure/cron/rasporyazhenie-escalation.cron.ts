/**
 * @module rasporyazhenie-escalation.cron
 * @description Coordination / Council — rasporyajeniye (директор farmoyishi) muddat-eskalatsiyasi.
 *   Vizyon (Coordination Q77/Q89/Q116 + 05-director.md #33): 3-bosqichli zanjir —
 *   (1) muddati o'tganda 'overdue' deb belgilanadi, ijrochi + chiqaruvchiga xabar (avvalgi
 *   1-bosqichli xatti-harakat, o'zgarishsiz saqlanadi); (2) yana N kun o'tsa — ijrochining
 *   menejeriga eskalatsiya; (3) yana N kun o'tsa — HR intizom tizimiga (`discipline_records`)
 *   uzatiladi (terminal).
 *
 *   Item #105 (2026-08-05): avvalgi versiya faqat 1-bosqichli edi (status='overdue' dedup,
 *   ikkinchi org-daraja/HR bog'lanish yo'q edi). endi escalation_stage (0→1→2→3) ustuni
 *   har bosqichni kuzatadi; chegaralar business_settings'dan o'qiladi.
 *
 * NOTE: Raw SQL — UPDATE ... RETURNING bilan bir o'tishda bosqich oshirish + qatorlarni
 *   bildirishnoma uchun qaytarish; CURRENT_DATE sana-arifmetikasi (deadline = date).
 *   See ARCHITECTURE_RULES.md Rule 4.
 * @layer Cron (Director / Coordination)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { getBusinessSettingNumber } from '../../../../shared/config/business-settings.reader';
import { SYSTEM_USER_ID } from '@common/constants/app.constants';
import { resolveNextOrgLevel, resolveEmployeeIdForUser } from './director-escalation-org-resolver.util';

type RaspRow = { id: number; from_user_id: number | null; to_user: string | null; task: string | null };

@Injectable()
export class RasporyazhenieEscalationCron {
  private readonly logger = new Logger(RasporyazhenieEscalationCron.name);

  /** Har kuni 09:00 — 3 bosqichni ketma-ket tekshiradi. */
  @Cron('0 9 * * *')
  async escalateOverdue(): Promise<void> {
    try {
      const stage2Days = await getBusinessSettingNumber('director.rasp_escalation_stage2_days', 1);
      const stage3Days = await getBusinessSettingNumber('director.rasp_escalation_stage3_days', 2);

      await this.stage0to1();
      await this.stage1to2(stage2Days);
      await this.stage2to3(stage3Days);
    } catch (e) {
      this.logger.error(`escalateOverdue: ${(e as Error).message}`);
    }
  }

  /** Stage 0→1 (o'zgarishsiz): deadline < bugun bo'lgan hali-bajarilmagan farmoyishlar. */
  private async stage0to1(): Promise<void> {
    const r = await runQuery<RaspRow>(sql`
      UPDATE rasporyazhenie
      SET status = 'overdue', escalation_stage = 1, updated_at = NOW()
      WHERE status NOT IN ('done', 'overdue', 'cancelled')
        AND deadline IS NOT NULL
        AND deadline < CURRENT_DATE
        AND deleted_at IS NULL
      RETURNING id, from_user_id, to_user::text AS to_user, task
    `);
    if (r.rows.length === 0) return;
    this.logger.warn(`Rasporyazhenie eskalatsiya: ${r.rows.length} farmoyish muddati o'tdi (stage 1)`);

    await Promise.all(r.rows.map(async (row) => {
      const taskShort = (row.task ?? 'Farmoyish').slice(0, 80);
      const assigneeId = row.to_user && /^\d+$/.test(row.to_user) ? Number(row.to_user) : null;
      if (assigneeId) {
        await this.notify(assigneeId, row.id, 'rasporyazhenie_overdue',
          'Farmoyish muddati o\'tdi',
          `«${taskShort}» farmoyishi muddati o'tib ketdi. Iltimos, zudlik bilan bajaring.`,
          'high');
      }
      if (row.from_user_id) {
        await this.notify(row.from_user_id, row.id, 'rasporyazhenie_overdue_issuer',
          'Sizning farmoyishingiz muddati o\'tdi',
          `«${taskShort}» farmoyishi belgilangan muddatda bajarilmadi.`,
          'normal');
      }
    }));
  }

  /** Stage 1→2: ijrochining menejeriga eskalatsiya. */
  private async stage1to2(stage2Days: number): Promise<void> {
    const r = await runQuery<RaspRow>(sql`
      UPDATE rasporyazhenie
      SET escalation_stage = 2, updated_at = NOW()
      WHERE status = 'overdue'
        AND escalation_stage = 1
        AND deadline IS NOT NULL
        AND deadline < (CURRENT_DATE - (${stage2Days} || ' days')::interval)::date
        AND deleted_at IS NULL
      RETURNING id, from_user_id, to_user::text AS to_user, task
    `);
    if (r.rows.length === 0) return;
    this.logger.warn(`Rasporyazhenie eskalatsiya: ${r.rows.length} farmoyish stage 2ga o'tdi`);

    await Promise.all(r.rows.map(async (row) => {
      const assigneeId = row.to_user && /^\d+$/.test(row.to_user) ? Number(row.to_user) : null;
      if (!assigneeId) return;
      const manager = await resolveNextOrgLevel(assigneeId);
      if (!manager) return;
      const taskShort = (row.task ?? 'Farmoyish').slice(0, 80);
      await this.notify(manager, row.id, 'rasporyazhenie_stage2_escalated',
        'Farmoyish — takroriy eskalatsiya',
        `«${taskShort}» farmoyishi (ijrochingizga topshirilgan) hali bajarilmadi. Ko'rib chiqishingiz so'raladi.`,
        'urgent');
    }));
  }

  /** Stage 2→3 (terminal): HR discipline_records + best-effort xabar. */
  private async stage2to3(stage3Days: number): Promise<void> {
    const r = await runQuery<RaspRow>(sql`
      UPDATE rasporyazhenie
      SET escalation_stage = 3, updated_at = NOW()
      WHERE status = 'overdue'
        AND escalation_stage = 2
        AND deadline IS NOT NULL
        AND deadline < (CURRENT_DATE - (${stage3Days} || ' days')::interval)::date
        AND deleted_at IS NULL
      RETURNING id, from_user_id, to_user::text AS to_user, task
    `);
    if (r.rows.length === 0) return;
    this.logger.warn(`Rasporyazhenie eskalatsiya: ${r.rows.length} farmoyish HR intizomga uzatildi`);

    await Promise.all(r.rows.map(async (row) => {
      const assigneeId = row.to_user && /^\d+$/.test(row.to_user) ? Number(row.to_user) : null;
      const taskShort = (row.task ?? 'Farmoyish').slice(0, 80);
      if (assigneeId) {
        const employeeId = await resolveEmployeeIdForUser(assigneeId);
        if (employeeId) {
          await runQuery(sql`
            INSERT INTO discipline_records
              (employee_id, violation_type, discipline_type, severity, violation_date, issued_date,
               description, reason, given_by, status)
            VALUES (
              ${employeeId}, 'rasporyazhenie_sla_unresolved', 'administrative', 'minor', CURRENT_DATE, CURRENT_DATE,
              ${'Farmoyish #' + row.id + ' (' + taskShort + ') 3x SLA dan keyin ham bajarilmadi'},
              'Avtomatik: director eskalatsiya zanjiri (vision 05-director.md #33)',
              ${SYSTEM_USER_ID}, 'open'
            )
          `);
        } else {
          this.logger.warn(`stage2to3(rasp #${row.id}): assignee=${assigneeId} uchun employees yozuvi topilmadi — discipline_records o'tkazib yuborildi`);
        }
      }
      if (row.from_user_id) {
        await this.notify(row.from_user_id, row.id, 'rasporyazhenie_hr_escalated',
          'Farmoyish HR intizom tizimiga uzatildi',
          `«${taskShort}» farmoyishi 3 marta eslatilgandan keyin ham bajarilmadi — HR intizom yozuvi yaratildi.`,
          'urgent');
      }
    }));
  }

  private async notify(
    userId: number, raspId: number, type: string, title: string, body: string,
    priority: 'low' | 'normal' | 'high' | 'urgent',
  ): Promise<void> {
    await runQuery(sql`
      INSERT INTO notifications
        (user_id, type, title, body, is_read, reference_id, reference_type, priority, created_at)
      VALUES
        (${userId}, ${type}, ${title}, ${body}, false, ${raspId}, 'rasporyazhenie', ${priority}, NOW())
    `);
  }
}
