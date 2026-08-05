/**
 * @module zno-zvs-sla-escalation.cron
 * @description Director/HR — ZNO (to'lov so'rovi) va ZVS (xarajat so'rovi) SLA-eskalatsiyasi.
 *   Vizyon (MASTER-REJA-VIZYON-2026-07-02.md band 3.7 + 05-director.md #33): 3-bosqichli
 *   zanjir — (1) muddati o'tganda so'rov egasi + navbatdagi org-daraja (submitted_by'ning
 *   menejeri) ogohlantiriladi (avvalgi 1-bosqichli xatti-harakat, o'zgarishsiz saqlanadi);
 *   (2) yana bir SLA-multiplikator o'tsa — "menejerning menejeri"ga eskalatsiya; (3) yana
 *   bir SLA-multiplikator o'tsa — HR intizom tizimiga (`discipline_records`) uzatiladi
 *   (terminal, qayta eskalatsiya yo'q).
 *
 *   Item #105 (2026-08-05): avvalgi versiya faqat 1-bosqichli edi (escalated_at IS NULL
 *   dedup, bitta org-daraja, HR bilan bog'lanish yo'q edi). endi escalation_stage (0→1→2→3)
 *   ustuni har bosqichni kuzatadi; chegaralar business_settings'dan o'qiladi (hardcode yo'q).
 *
 *   SLA muddati: ZNO = 24 soat, ZVS = 48 soat (1-bosqich, o'zgarishsiz). 2/3-bosqich
 *   chegaralari business_settings'dagi director.escalation_stage2/3_sla_multiplier (bazaviy
 *   SLA'ning necha barobari) orqali hisoblanadi.
 *
 * NOTE: Raw SQL — UPDATE...RETURNING bir o'tishda `escalation_stage` bosqichini oshirish +
 *   bildirishnoma uchun qatorlarni qaytarish; `created_at + (N || ' hours')::interval < NOW()`
 *   vaqt-arifmetikasi (cc-sla.cron.ts'dagi bilan bir xil naqsh). `zvs`/`zno` Drizzle schema
 *   barrelida yo'q (raw SQL bilan yozilgan repo naqshi allaqachon mavjud). See ARCHITECTURE_RULES.md Rule 4.
 * @layer Cron (Director / HR — ZNO/ZVS)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { getBusinessSettingNumber } from '../../../../shared/config/business-settings.reader';
import { SYSTEM_USER_ID } from '@common/constants/app.constants';
import { resolveNextOrgLevel, resolveEmployeeIdForUser } from './director-escalation-org-resolver.util';

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
   * Har soatning 15-daqiqasida — ZNO (24h) va ZVS (48h) bazaviy SLA'dan boshlab
   * har 3 bosqichni tekshiradi.
   */
  @Cron('15 * * * *')
  async escalateOverdue(): Promise<void> {
    const stage2Mult = await getBusinessSettingNumber('director.escalation_stage2_sla_multiplier', 2);
    const stage3Mult = await getBusinessSettingNumber('director.escalation_stage3_sla_multiplier', 3);

    try {
      await this.escalateKind('zno', ZNO_SLA_HOURS, stage2Mult, stage3Mult);
    } catch (e) {
      this.logger.error(`escalateZno: ${(e as Error).message}`);
    }
    try {
      await this.escalateKind('zvs', ZVS_SLA_HOURS, stage2Mult, stage3Mult);
    } catch (e) {
      this.logger.error(`escalateZvs: ${(e as Error).message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  private async escalateKind(kind: 'zno' | 'zvs', slaHours: number, stage2Mult: number, stage3Mult: number): Promise<void> {
    await this.escalateStage(kind, slaHours, 0, 1, 1, (row) => this.notifyStage1(kind, slaHours, row));
    await this.escalateStage(kind, slaHours, 1, 2, stage2Mult, (row) => this.notifyStage2(kind, slaHours, row));
    await this.escalateStage(kind, slaHours, 2, 3, stage3Mult, (row) => this.escalateToHr(kind, row));
  }

  // NOTE: table name is NOT interpolated as a SQL variable (Qoida B — sql.raw(variable)
  // taqiqlangan) — two literal branches instead, exactly mirroring the original
  // escalateZno()/escalateZvs() duplication, just with a shared stage-threshold param.
  private async escalateStage(
    kind: 'zno' | 'zvs', slaHours: number, fromStage: number, toStage: number, multiplier: number,
    handle: (row: OverdueRow) => Promise<void>,
  ): Promise<void> {
    const hoursThreshold = slaHours * multiplier;
    const r = kind === 'zno'
      ? await runQuery<OverdueRow>(sql`
          UPDATE zno
          SET escalation_stage = ${toStage}, escalated_at = NOW(), updated_at = NOW()
          WHERE status = 'pending'
            AND escalation_stage = ${fromStage}
            AND created_at + (${hoursThreshold} || ' hours')::interval < NOW()
          RETURNING id, submitted_by, purpose, amount::text AS amount
        `)
      : await runQuery<OverdueRow>(sql`
          UPDATE zvs
          SET escalation_stage = ${toStage}, escalated_at = NOW(), updated_at = NOW()
          WHERE status = 'pending'
            AND escalation_stage = ${fromStage}
            AND created_at + (${hoursThreshold} || ' hours')::interval < NOW()
          RETURNING id, submitted_by, purpose, amount::text AS amount
        `);
    if (r.rows.length === 0) return;
    this.logger.warn(`${kind.toUpperCase()} SLA eskalatsiya: ${r.rows.length} so'rov ${fromStage}->${toStage} bosqichga o'tdi`);
    await Promise.all(r.rows.map(handle));
  }

  // ─────────────────────────────────────────────────────────────────────
  private async notifyStage1(kind: 'zno' | 'zvs', slaHours: number, row: OverdueRow): Promise<void> {
    const purposeShort = (row.purpose ?? (kind === 'zno' ? 'ZNO so\'rov' : 'ZVS so\'rov')).slice(0, 80);
    const kindLabel = kind === 'zno' ? 'ZNO (to\'lov so\'rovi)' : 'ZVS (xarajat so\'rovi)';

    if (row.submitted_by) {
      await this.notify(row.submitted_by, row.id, `${kind}_sla_overdue`,
        `${kindLabel} muddati o'tdi`,
        `«${purposeShort}» (${row.amount ?? ''}) ${slaHours} soatdan beri ko'rib chiqilmadi. Eskalatsiya qilindi.`,
        'high', kind);
    }

    const nextLevelUserId = row.submitted_by ? await resolveNextOrgLevel(row.submitted_by) : null;
    if (nextLevelUserId && nextLevelUserId !== row.submitted_by) {
      await this.notify(nextLevelUserId, row.id, `${kind}_sla_escalated`,
        `${kindLabel} eskalatsiya qilindi`,
        `«${purposeShort}» (${row.amount ?? ''}) ${slaHours} soatdan ko'p tasdiqlanmadi. Ko'rib chiqishingiz so'raladi.`,
        'urgent', kind);
    }
  }

  /** 2-bosqich: submitted_by'ning menejerining menejeri (ikki qadam org-yurish). */
  private async notifyStage2(kind: 'zno' | 'zvs', slaHours: number, row: OverdueRow): Promise<void> {
    const purposeShort = (row.purpose ?? (kind === 'zno' ? 'ZNO so\'rov' : 'ZVS so\'rov')).slice(0, 80);
    const kindLabel = kind === 'zno' ? 'ZNO (to\'lov so\'rovi)' : 'ZVS (xarajat so\'rovi)';
    if (!row.submitted_by) return;

    const level1 = await resolveNextOrgLevel(row.submitted_by);
    const level2 = level1 ? await resolveNextOrgLevel(level1) : null;
    const target = level2 ?? level1;
    if (!target) return;

    await this.notify(target, row.id, `${kind}_sla_stage2_escalated`,
      `${kindLabel} — takroriy eskalatsiya`,
      `«${purposeShort}» (${row.amount ?? ''}) ${slaHours} soatlik bazaviy muddatdan ancha ko'p tasdiqlanmadi. Zudlik bilan ko'rib chiqing.`,
      'urgent', kind);
  }

  /** 3-bosqich (terminal): HR discipline_records + best-effort xabar. */
  private async escalateToHr(kind: 'zno' | 'zvs', row: OverdueRow): Promise<void> {
    if (!row.submitted_by) return;
    const purposeShort = (row.purpose ?? (kind === 'zno' ? 'ZNO so\'rov' : 'ZVS so\'rov')).slice(0, 80);

    const employeeId = await resolveEmployeeIdForUser(row.submitted_by);
    if (employeeId) {
      await runQuery(sql`
        INSERT INTO discipline_records
          (employee_id, violation_type, discipline_type, severity, violation_date, issued_date,
           description, reason, given_by, status)
        VALUES (
          ${employeeId}, ${kind + '_sla_unresolved'}, 'administrative', 'minor', CURRENT_DATE, CURRENT_DATE,
          ${'#' + row.id + ' (' + purposeShort + ') 3x SLA dan keyin ham hal qilinmadi'},
          ${'Avtomatik: director eskalatsiya zanjiri (vision 05-director.md #33)'},
          ${SYSTEM_USER_ID}, 'open'
        )
      `);
    } else {
      this.logger.warn(`escalateToHr(${kind} #${row.id}): submitted_by=${row.submitted_by} uchun employees yozuvi topilmadi — discipline_records o'tkazib yuborildi`);
    }

    const target = await resolveNextOrgLevel(row.submitted_by);
    if (target) {
      await this.notify(target, row.id, `${kind}_sla_hr_escalated`,
        'HR intizom tizimiga uzatildi',
        `«${purposeShort}» so'rovi 3 marta SLA'dan oshdi — HR intizom yozuvi yaratildi.`,
        'urgent', kind);
    }
  }

  private async notify(
    userId: number, refId: number, type: string, title: string, body: string,
    priority: 'low' | 'normal' | 'high' | 'urgent', refType: string,
  ): Promise<void> {
    await runQuery(sql`
      INSERT INTO notifications
        (user_id, type, title, body, is_read, reference_id, reference_type, priority, created_at)
      VALUES
        (${userId}, ${type}, ${title}, ${body}, false, ${refId}, ${refType}, ${priority}, NOW())
    `);
  }
}
