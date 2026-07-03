/**
 * @module zno-zvs-sla-escalation.cron
 * @description Director/HR — ZNO (to'lov so'rovi) va ZVS (xarajat so'rovi) SLA-eskalatsiyasi.
 *   Vizyon (MASTER-REJA-VIZYON-2026-07-02.md band 3.7): "ZNO/ZVS 24/48h SLA-eskalatsiya cron —
 *   Muddati o'tgan so'rov avto-eskalatsiya". Tekshiruv (2026-07-03): `zno`/`zvs` jadvallarida
 *   `pending` holatda muddat-tekshiruvchi cron YO'Q edi — so'rov abadiy `pending`da qolishi mumkin
 *   edi. Bu cron shu bo'shliqni yopadi (cc-sla.cron / rasporyazhenie-escalation.cron bilan bir xil
 *   naqsh: UPDATE...RETURNING + fan-out bildirishnoma).
 *
 *   SLA muddati: ZNO = 24 soat (oddiy to'lov so'rovi, bir bosqichli tasdiq), ZVS = 48 soat
 *   (ko'p bosqichli: level 1/2/3 — yuqori darajali tasdiqlovchi topilishi ko'proq vaqt oladi;
 *   cc-sla.cron.ts'dagi 48h auto-reject bilan bir xil chegara).
 *
 *   Eskalatsiya qabul-mezoni: muddati o'tgan `pending` so'rov holati o'zgartirilmaydi (hali
 *   tasdiq/rad kutmoqda — status='pending' qoladi, faqat `escalated_at` belgilanadi va
 *   dedup uchun ishlatiladi), lekin (a) so'rov egasiga "muddat o'tdi" bildirishnomasi va
 *   (b) navbatdagi org-daraja (submitted_by → employees.manager_id → users.id; agar
 *   manager_id yo'q/0 bo'lsa — org_departments daraxti bo'ylab yuqoriga eng yaqin
 *   head_user_id, `cc-org-resolver.service.ts`dagi MANAGER_OF_SENDER fallback bilan bir xil
 *   naqsh) uchun eskalatsiya-bildirishnomasi yuboriladi.
 *
 *   Dedup: `escalated_at IS NULL` shartи — bir marta eskalatsiya qilingan so'rov qayta
 *   ishlanmaydi (keyingi yurishlarda o'tkazib yuboriladi, lekin submitted_by hali pending
 *   bo'lgani uchun ko'rinadi — takroriy notification-spam yo'q).
 *
 * NOTE: Raw SQL — UPDATE...RETURNING bir o'tishda `escalated_at` belgilash + bildirishnoma
 *   uchun qatorlarni qaytarish; `created_at + (N || ' hours')::interval < NOW()` vaqt-arifmetikasi
 *   (cc-sla.cron.ts'dagi `(inbox_sla_hours || ' hours')::interval` bilan bir xil naqsh).
 *   `zvs`/`zno` Drizzle schema barrelida yo'q (raw SQL bilan yozilgan repo naqshi allaqachon
 *   mavjud — zvs.repository.ts / zno.repository.ts). See ARCHITECTURE_RULES.md Rule 4.
 * @layer Cron (Director / HR — ZNO/ZVS)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

const ZNO_SLA_HOURS = 24;
const ZVS_SLA_HOURS = 48;

type OverdueRow = {
  id: number;
  submitted_by: number | null;
  purpose: string | null;
  amount: string | null;
};

@Injectable()
export class ZnoZvsSlaEscalationCron {
  private readonly logger = new Logger(ZnoZvsSlaEscalationCron.name);

  /**
   * Har soatning 15-daqiqasida — ZNO (24h) va ZVS (48h) muddati o'tgan `pending`
   * so'rovlarni eskalatsiya qilish.
   */
  @Cron('15 * * * *')
  async escalateOverdue(): Promise<void> {
    try {
      await this.escalateZno();
    } catch (e) {
      this.logger.error(`escalateZno: ${(e as Error).message}`);
    }
    try {
      await this.escalateZvs();
    } catch (e) {
      this.logger.error(`escalateZvs: ${(e as Error).message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  private async escalateZno(): Promise<void> {
    const r = await runQuery<OverdueRow>(sql`
      UPDATE zno
      SET escalated_at = NOW(), updated_at = NOW()
      WHERE status = 'pending'
        AND escalated_at IS NULL
        AND created_at + (${ZNO_SLA_HOURS} || ' hours')::interval < NOW()
      RETURNING id, submitted_by, purpose, amount::text AS amount
    `);
    if (r.rows.length === 0) return;
    this.logger.warn(`ZNO SLA eskalatsiya: ${r.rows.length} so'rov ${ZNO_SLA_HOURS}h muddatini o'tkazdi`);
    await Promise.all(r.rows.map((row) => this.notifyOverdue('zno', row)));
  }

  private async escalateZvs(): Promise<void> {
    const r = await runQuery<OverdueRow>(sql`
      UPDATE zvs
      SET escalated_at = NOW(), updated_at = NOW()
      WHERE status = 'pending'
        AND escalated_at IS NULL
        AND created_at + (${ZVS_SLA_HOURS} || ' hours')::interval < NOW()
      RETURNING id, submitted_by, purpose, amount::text AS amount
    `);
    if (r.rows.length === 0) return;
    this.logger.warn(`ZVS SLA eskalatsiya: ${r.rows.length} so'rov ${ZVS_SLA_HOURS}h muddatini o'tkazdi`);
    await Promise.all(r.rows.map((row) => this.notifyOverdue('zvs', row)));
  }

  // ─────────────────────────────────────────────────────────────────────
  private async notifyOverdue(kind: 'zno' | 'zvs', row: OverdueRow): Promise<void> {
    const purposeShort = (row.purpose ?? (kind === 'zno' ? 'ZNO so\'rov' : 'ZVS so\'rov')).slice(0, 80);
    const kindLabel = kind === 'zno' ? 'ZNO (to\'lov so\'rovi)' : 'ZVS (xarajat so\'rovi)';
    const slaHours = kind === 'zno' ? ZNO_SLA_HOURS : ZVS_SLA_HOURS;

    // 1. So'rov egasi — o'z so'rovi hali ko'rib chiqilmagani haqida xabar.
    if (row.submitted_by) {
      await this.notify(
        row.submitted_by,
        row.id,
        `${kind}_sla_overdue`,
        `${kindLabel} muddati o'tdi`,
        `«${purposeShort}» (${row.amount ?? ''}) ${slaHours} soatdan beri ko'rib chiqilmadi. Eskalatsiya qilindi.`,
        'high',
      );
    }

    // 2. Navbatdagi org-daraja — submitted_by'ning menejeri (yoki org daraxti bo'ylab
    //    eng yaqin bo'lim rahbari — cc-org-resolver.service.ts MANAGER_OF_SENDER bilan bir xil naqsh).
    const nextLevelUserId = row.submitted_by ? await this.resolveNextLevel(row.submitted_by) : null;
    if (nextLevelUserId && nextLevelUserId !== row.submitted_by) {
      await this.notify(
        nextLevelUserId,
        row.id,
        `${kind}_sla_escalated`,
        `${kindLabel} eskalatsiya qilindi`,
        `«${purposeShort}» (${row.amount ?? ''}) ${slaHours} soatdan ko'p tasdiqlanmadi. Ko'rib chiqishingiz so'raladi.`,
        'urgent',
      );
    }
  }

  // submitted_by → employees.manager_id → users.id; manager_id yo'q/0 bo'lsa
  // org_departments daraxti bo'ylab yuqoriga eng yaqin head_user_id (cc-org-resolver.service.ts
  // resolveManagerOfSender bilan bir xil ikki bosqichli fallback).
  private async resolveNextLevel(senderUserId: number): Promise<number | null> {
    const direct = await runQuery<{ user_id: number | null }>(sql`
      SELECT m.user_id
      FROM employees e
      JOIN employees m ON m.id = e.manager_id
      WHERE e.user_id = ${senderUserId} AND e.manager_id IS NOT NULL AND e.manager_id <> 0
      LIMIT 1
    `);
    const directId = direct.rows[0]?.user_id ?? null;
    if (directId) return directId;

    const walk = await runQuery<{ head_user_id: number | null }>(sql`
      WITH RECURSIVE chain AS (
        SELECT od.id, od.parent_id, od.head_user_id, 0 AS depth
        FROM employee_org_departments eod
        JOIN org_departments od ON od.id = eod.org_department_id
        WHERE eod.user_id = ${senderUserId} AND eod.is_primary = true
        UNION ALL
        SELECT p.id, p.parent_id, p.head_user_id, c.depth + 1
        FROM chain c
        JOIN org_departments p ON p.id = c.parent_id
        WHERE c.depth < 20
      )
      SELECT head_user_id FROM chain
      WHERE head_user_id IS NOT NULL AND head_user_id <> ${senderUserId}
      ORDER BY depth
      LIMIT 1
    `);
    const headId = walk.rows[0]?.head_user_id ?? null;
    if (!headId) {
      this.logger.warn(
        `resolveNextLevel(sender=${senderUserId}): manager_id NULL/0 va org tree'da bo'lim rahbari yo'q — escalation notify skip`,
      );
      return null;
    }
    return headId;
  }

  private async notify(
    userId: number, refId: number, type: string, title: string, body: string,
    priority: 'low' | 'normal' | 'high' | 'urgent',
  ): Promise<void> {
    // notifications NOT NULL: user_id, type, title, body, is_read. reference_*/priority — havola.
    await runQuery(sql`
      INSERT INTO notifications
        (user_id, type, title, body, is_read, reference_id, reference_type, priority, created_at)
      VALUES
        (${userId}, ${type}, ${title}, ${body}, false, ${refId}, ${type.split('_')[0]}, ${priority}, NOW())
    `);
  }
}
