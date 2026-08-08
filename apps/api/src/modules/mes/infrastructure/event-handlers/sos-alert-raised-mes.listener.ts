/**
 * @module sos-alert-raised-mes.listener
 * @description Master-reja 2.3 (2026-07-03) — SOS ikki-dunyo bog'lovchisi.
 *   iot-tablet.controller.ts POST /api/iot/tablet/sos-alert → IotTabletService.raiseSosAlert
 *   `sos_alerts`ga yozadi va CQRS `SosAlertRaisedEvent`ni chiqaradi (EventBridge uni
 *   legacy `iot.sos.raised` nomiga ham ko'taradi — erp-events.constants.ts:59,
 *   event-bridge.service.ts:68). Bu event'ning ILGARI ZERO listener'i bor edi:
 *   mes-sos-escalation.service.ts faqat `mes_sos_events` jadvalini o'qiydi (cron orqali),
 *   tablet esa `sos_alerts`ga yozadi — ikki dunyo hech qachon uchrashmagan.
 *
 *   Yechim (kam-duplikatsiya tanlovi): yangi jadval/servis YARATILMAYDI — mavjud
 *   `MesSosEscalationService.assignOnRaise` qayta ishlatiladi. Bu listener:
 *    1) tablet SOS uchun `mes_sos_events`da OYNA-QATOR yaratadi (session_id/employee_id/
 *       reason/work_center_id — mavjud SOS ustuvorlik-zanjiri shu jadvalni o'qiydi);
 *    2) `work_centers`ni `equipment.work_center_id` orqali topadi (tablet payload'i
 *       `equipmentId` = `equipment.id`, MES esa `work_center_id` kutadi);
 *    3) `assignOnRaise`ni chaqiradi — bu boshlang'ich javobgar kartani biriktiradi,
 *       deadline qo'yadi va `notifications`ga yozadi (eskalatsiya-cron shu yerdan davom
 *       etadi — mes-sos-escalation.cron.ts har 2 daqiqada `escalation_due_at`ni tekshiradi).
 *
 *   Natija: tablet SOS → shu zahoti mes_sos_events qatori + boshlang'ich bildirishnoma;
 *   javobsiz qolsa cron uni ko'radi va org-zanjir bo'ylab ko'taradi (qabul-mezoni bajarildi).
 *
 *   Anonim SOS (Q-40/Q-46 xavfsizlik): tablet "panic" tugmasi workerId=0 bilan ham
 *   yuborilishi mumkin (iot-tablet.schemas.ts coerceWorkerId — noma'lum foydalanuvchi ham
 *   bosishi mumkin, xavfsizlik tugmasi berk holatda ishlamasligi kerak). `mes_sos_events
 *   .employee_id` ustunida `employees(id)` FK bor — 0/mavjud-bo'lmagan id yozish INSERT'ni
 *   butunlay qulatib, hodisani yo'qotardi. Shuning uchun employee_id faqat haqiqiy musbat
 *   workerId bo'lsa yoziladi, aks holda NULL (ustun NULL-ga ruxsat beradi, ON DELETE SET
 *   NULL) — SOS qatori har doim yaratiladi, faqat egasi noma'lum bo'lib qoladi.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { SosAlertRaisedEvent } from '@modules/iot/domain/events/sos-alert-raised.event';
import { MesSosEscalationService } from '../../application/mes-sos-escalation.service';

type Rows = { rows?: unknown[] };

@Injectable()
@EventsHandler(SosAlertRaisedEvent)
export class SosAlertRaisedMesListener implements IEventHandler<SosAlertRaisedEvent> {
  private readonly logger = new Logger(SosAlertRaisedMesListener.name);

  constructor(private readonly escalation: MesSosEscalationService) {}

  async handle(event: SosAlertRaisedEvent): Promise<void> {
    try {
      // equipment.id (tablet payload) → work_centers.id (MES eskalatsiya-zanjiri shuni kutadi).
      let workCenterId: number | null = null;
      if (event.equipmentId !== null) {
        const eqRows = ((await db.execute(sql`
          SELECT work_center_id FROM equipment WHERE id = ${event.equipmentId}
        `)) as Rows).rows ?? [];
        const wc = (eqRows[0] as Record<string, unknown> | undefined)?.work_center_id;
        workCenterId = wc != null ? Number(wc) : null;
      }

      const reason = event.message && event.message.length > 0
        ? event.message
        : `SOS (${event.alertType})`;

      // employee_id FK guard — anonymous panic press (workerId=0) must still create the row.
      const employeeId = Number.isFinite(event.workerId) && event.workerId > 0 ? event.workerId : null;

      const inserted = ((await db.execute(sql`
        INSERT INTO mes_sos_events
          (employee_id, reason, work_center_id, created_at, escalation_level, status, escalation_history)
        VALUES
          (${employeeId}, ${reason}, ${workCenterId}, ${event.raisedAt.toISOString()}::timestamptz, 0, 'open', '[]'::jsonb)
        RETURNING id
      `)) as Rows).rows ?? [];
      const mesSosId = (inserted[0] as Record<string, unknown> | undefined)?.id;
      if (mesSosId == null) {
        this.logger.error(`SOS #${event.alertId}: mes_sos_events insert failed (no id returned)`);
        return;
      }

      const assignR = await this.escalation.assignOnRaise(Number(mesSosId), workCenterId, reason);
      if (!assignR.ok) {
        this.logger.error(`SOS #${event.alertId}: assignOnRaise failed — ${assignR.error.message}`);
        return;
      }

      this.logger.warn(
        `SOS bridge: sos_alerts#${event.alertId} → mes_sos_events#${mesSosId} (worker=${event.workerId} workCenter=${workCenterId ?? 'n/a'}) — eskalatsiya-zanjiri ishga tushdi`,
      );
    } catch (err) {
      this.logger.error(`SosAlertRaisedMesListener: ${(err as Error).message}`);
    }
  }
}
