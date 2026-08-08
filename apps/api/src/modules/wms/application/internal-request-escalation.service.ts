/**
 * @module internal-request-escalation.service
 * @description WMS #32 (vizyon 10-warehouse.md #32) — "Rohler chaqiruv" 15/30/60 daqiqa eskalatsiya
 *   orkestratsiyasi. Bajarilmagan (pending) ichki material/uskuna so'rovi javobsiz qolsa RBAC
 *   zinapoyasi bo'ylab ko'tariladi: 15 daq → daraja 1 (smena/ombor mas'uli), 30 daq → daraja 2
 *   (ombor boshlig'i), 60 daq → daraja 3 (direktor). Nishon (kimga) CONFIG-DRIVEN —
 *   NotificationRoutingRepository.resolveUserIds(event_type, fallback_role); notification_routing_rules
 *   da qator bo'lmasa fallback rolga qaytadi (regressiya yo'q, Q-39). Fallback rollar jonli rollarga
 *   moslangan (manager/manager/director) — funksiya bo'sh sozlamada ham darrov ishlaydi; egasi/admin
 *   keyin aniq nishonni notification-routing CRUD orqali toraytiradi.
 *
 *   Har bildirishnoma "materialni kutish" downtime sabab-kodi (DT-MAT-WAIT) bilan MATNDA teglanadi —
 *   ALOHIDA downtime_events qatori YOZILMAYDI (downtime_events.session_id NOT NULL, bajarilmagan
 *   so'rovda MES sessiyasi yo'q; buildable-queue tuzatishi). Result<T> qaytaradi; raw throw yo'q (Qoida 1).
 */
import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { InternalRequestEscalationRepository } from '../infrastructure/repositories/internal-request-escalation.repository';
import { NotificationRoutingRepository } from '@modules/notifications/infrastructure/notification-routing.repository';

/** Eskalatsiya zinapoyasi — vizyon 10-warehouse.md #32 (15/30/60 daqiqa). Nishon config-driven; fallback = jonli rol. */
interface EscalationRung {
  level: number;
  thresholdMin: number;
  eventType: string;
  fallbackRole: string;
  priority: string;
}
const ESCALATION_LADDER: EscalationRung[] = [
  { level: 1, thresholdMin: 15, eventType: 'wms.rohler_escalation.l1', fallbackRole: 'manager',  priority: 'normal' },
  { level: 2, thresholdMin: 30, eventType: 'wms.rohler_escalation.l2', fallbackRole: 'manager',  priority: 'high'   },
  { level: 3, thresholdMin: 60, eventType: 'wms.rohler_escalation.l3', fallbackRole: 'director', priority: 'urgent' },
];

@Injectable()
export class InternalRequestEscalationService {
  private readonly logger = new Logger(InternalRequestEscalationService.name);

  constructor(
    private readonly repo: InternalRequestEscalationRepository,
    private readonly routing: NotificationRoutingRepository,
  ) {}

  /** Berilgan javobsizlik daqiqasi uchun mos eng yuqori eskalatsiya darajasi (0 = hali erta). */
  private targetLevel(elapsedMin: number): number {
    let level = 0;
    for (const rung of ESCALATION_LADDER) {
      if (elapsedMin >= rung.thresholdMin) level = rung.level;
    }
    return level;
  }

  /**
   * Cron chaqiradi — pending rohler/material so'rovlarni tekshirib, muddati o'tganlarni keyingi
   * (hali yuborilmagan) darajaga eskalatsiya qiladi va javobgar(lar)ga bildirishnoma yozadi.
   * Bir so'rov uchun bir darajada faqat bir marta yuboriladi (repo NOT EXISTS dedup).
   */
  async escalateOverdue(): Promise<Result<{ escalated: number; notified: number }, AppError>> {
    return safeCall(async () => {
      const rows = await this.repo.findEscalatable();
      let escalated = 0;
      let notified = 0;

      for (const row of Array.isArray(rows) ? rows : []) {
        const target = this.targetLevel(row.elapsed_min);
        if (target <= row.last_level) continue; // shu daraja allaqachon yuborilgan

        const rung = ESCALATION_LADDER[target - 1];
        if (!rung) continue;

        const usersR = await this.routing.resolveUserIds(rung.eventType, rung.fallbackRole);
        const userIds = usersR.ok ? usersR.data : [];
        if (userIds.length === 0) continue;

        const typeTag = `wms_rohler_escl_l${rung.level}`;
        const title = `Rohler chaqiruv eskalatsiya (daraja ${rung.level})`;
        const body =
          `${row.request_no}: ${row.material_name} — ${row.elapsed_min} daqiqa javobsiz (rohler chaqiruv). ` +
          `Sabab kodi: DT-MAT-WAIT (materialni kutish).`;

        let firedForRequest = false;
        for (const userId of userIds) {
          const ok = await this.repo.insertEscalationNotification(
            userId, row.id, typeTag, title, body, rung.priority,
          );
          if (ok) { notified += 1; firedForRequest = true; }
        }
        if (firedForRequest) {
          escalated += 1;
          this.logger.log(
            `Rohler eskalatsiya: so'rov ${row.request_no} → daraja ${rung.level} (${userIds.length} nishon)`,
          );
        }
      }

      return { escalated, notified };
    });
  }
}
