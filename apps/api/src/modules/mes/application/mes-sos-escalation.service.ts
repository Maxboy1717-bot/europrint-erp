/**
 * @module mes-sos-escalation.service
 * @description SOS/downtime org-zanjir eskalatsiya orkestratsiyasi (#11).
 *   - assignOnRaise: SOS ko'tarilganda boshlang'ich javobgar kartani (work_center → org_dept)
 *     biriktiradi, deadline qo'yadi, javobgarga bildirishnoma yuboradi.
 *   - escalateOverdue: timeout-cron chaqiradi — javob yo'q (deadline o'tgan) SOS'larni
 *     org_departments.parent_id bo'ylab keyingi darajaga (usta→bo'lim→direktor) ko'taradi.
 *     Zanjir eng yuqori kartaga (parent yo'q — direktor) yetganda ham hal qilinmagan SOS
 *     CRITICAL hisoblanadi — bu eng yuqori eskalatsiya darajasi bo'lgani uchun Telegram
 *     orqali ham xabar beriladi (DB notification'dan tashqari; boshqa zanjir bosqichlari
 *     faqat DB notification bilan cheklanadi — spam bo'lmasligi uchun).
 *   - resolve: SOS hal qilindi → eskalatsiya to'xtaydi.
 *   Result<T> qaytaradi; raw throw yo'q.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { safeCall, Result, AppError } from '@common/result';
import { MesSosEscalationRepository } from '../infrastructure/repositories/mes-sos-escalation.repo';
import { ITelegramSender, TELEGRAM_SENDER } from '@modules/notifications/domain/ports/i-telegram-sender.port';
import { CcSpawnRequestedEvent } from '../../communication-center/domain/events/cc-spawn-requested.event';

/** Zanjir tepasiga yetgan (parent yo'q) hal qilinmagan SOS uchun Telegram kanal identifikatori. */
const MES_SOS_CRITICAL_TELEGRAM_CHANNEL = 'mes_sos_critical';

@Injectable()
export class MesSosEscalationService {
  private readonly logger = new Logger(MesSosEscalationService.name);

  constructor(
    private readonly repo: MesSosEscalationRepository,
    @Inject(TELEGRAM_SENDER) private readonly telegram: ITelegramSender,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * SOS ko'tarilganda boshlang'ich javobgarni biriktiradi (level 0 = usta/karta egasi).
   * work_center → KARTA topilmasa, jim qaytadi (eskalatsiya bo'lmaydi, faqat SOS qatori qoladi).
   */
  async assignOnRaise(sosId: number, workCenterId: number | null, reason: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const node = await this.repo.resolveInitialDepartment(workCenterId);
      if (!node) {
        this.logger.warn(`SOS #${sosId}: work_center ${workCenterId} → karta topilmadi, eskalatsiya yo'q`);
        return { assigned: false, sosId };
      }
      const updated = await this.repo.assignInitialResponsible(sosId, node);
      await this.repo.notifyResponsible(node.head_user_id, sosId, reason, 0);
      return { assigned: true, sosId, department_id: node.department_id, user_id: node.head_user_id, row: updated };
    });
  }

  /**
   * Timeout-cron: deadline o'tgan barcha hal-qilinmagan SOS'larni keyingi parent kartaga ko'taradi.
   * parent yo'q (zanjir tepasi) → markChainExhausted (deadline tozalanadi, qayta eskalatsiya bo'lmaydi).
   * Eskalatsiya soni qaytariladi.
   */
  async escalateOverdue(): Promise<Result<{ escalated: number; exhausted: number }, AppError>> {
    return safeCall(async () => {
      const overdue = await this.repo.findOverdue();
      let escalated = 0;
      let exhausted = 0;

      for (const ev of Array.isArray(overdue) ? overdue : []) {
        const sosId = Number(ev.id);
        const currentDeptId = ev.current_department_id != null ? Number(ev.current_department_id) : null;
        const level = Number(ev.escalation_level ?? 0);
        const reason = String(ev.reason ?? 'SOS');
        const history = Array.isArray(ev.escalation_history) ? ev.escalation_history : [];
        // Owner decision 2026-07-13: real top-of-chain responsible user (already resolved
        // onto this row by assignInitialResponsible/escalateTo) — used below to address the
        // CC document when the chain is exhausted. No fabrication (Q-40): stays null when
        // the topmost karta has no head_user_id (owner-data gap), and the CC spawn is
        // skipped in that case.
        const assignedUserId = ev.assigned_user_id != null ? Number(ev.assigned_user_id) : null;
        const workCenterId = ev.work_center_id != null ? Number(ev.work_center_id) : null;

        if (!currentDeptId) {
          await this.repo.markChainExhausted(sosId);
          exhausted += 1;
          continue;
        }

        const parent = await this.repo.getParentDepartment(currentDeptId);
        if (!parent) {
          await this.repo.markChainExhausted(sosId);
          exhausted += 1;
          // CRITICAL: zanjir eng yuqori kartaga (direktor, parent yo'q) yetdi va SOS
          // hamon hal qilinmagan — bu eng yuqori eskalatsiya darajasi, shuning uchun
          // faqat shu holatda Telegram xabar yuboriladi (pastroq darajalar faqat DB
          // notification bilan cheklanadi). Best-effort: Result<T> tekshirilmaydi —
          // Telegram muvaffaqiyatsiz bo'lsa ham eskalatsiya hisobi buzilmasin.
          await this.telegram.sendAlert(
            MES_SOS_CRITICAL_TELEGRAM_CHANNEL,
            `KRITIK: SOS #${sosId} eskalatsiya zanjiri tugadi`,
            `Sabab: ${reason}. Karta #${currentDeptId} — zanjir tepasida (daraja ${level}) hamon javobsiz.`,
            'high',
          );
          // Owner decision 2026-07-13 (chat): the same CRITICAL moment also leaves a durable
          // CC document (template MES_ESCALATION) in the top-of-chain responsible user's
          // basket — not just a transient Telegram ping. Best-effort, non-fatal (mirrors
          // procurement-request.service.ts's CC spawn try/catch) — a CC hiccup must never
          // break the escalation count.
          if (assignedUserId != null) {
            try {
              this.eventBus.publish(new CcSpawnRequestedEvent({
                templateCode: 'MES_ESCALATION',
                senderUserId: assignedUserId,
                subject: `SOS eskalatsiya zanjiri tugadi — SOS #${sosId}`,
                body: `Sabab: ${reason}. ${workCenterId != null ? `Ish markazi #${workCenterId}. ` : ''}Karta #${currentDeptId} — zanjir tepasida (daraja ${level}) hamon javobsiz.`,
                priority: 'urgent',
                metadata: { sosId, currentDeptId, level, workCenterId },
              }));
            } catch (e) {
              this.logger.warn(`SOS #${sosId}: CC hujjat spawn xatosi (ignore) — ${String(e)}`);
            }
          }
          this.logger.error(`SOS #${sosId}: zanjir tepasiga yetdi (karta ${currentDeptId}), Telegram CRITICAL xabar yuborildi`);
          continue;
        }

        const nextLevel = level + 1;
        await this.repo.escalateTo(sosId, nextLevel, parent, history);
        await this.repo.notifyResponsible(parent.head_user_id, sosId, reason, nextLevel);
        escalated += 1;
        this.logger.log(`SOS #${sosId} eskalatsiya → daraja ${nextLevel} (karta ${parent.department_id})`);
      }

      return { escalated, exhausted };
    });
  }

  /** SOS hal qilindi → eskalatsiya to'xtaydi. */
  async resolve(sosId: number, resolvedBy: number | null): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      await this.repo.markResolved(sosId, resolvedBy);
      return { sosId, resolved: true };
    });
  }
}
