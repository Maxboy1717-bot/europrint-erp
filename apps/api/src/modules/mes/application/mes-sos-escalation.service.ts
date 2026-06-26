/**
 * @module mes-sos-escalation.service
 * @description SOS/downtime org-zanjir eskalatsiya orkestratsiyasi (#11).
 *   - assignOnRaise: SOS ko'tarilganda boshlang'ich javobgar kartani (work_center → org_dept)
 *     biriktiradi, deadline qo'yadi, javobgarga bildirishnoma yuboradi.
 *   - escalateOverdue: timeout-cron chaqiradi — javob yo'q (deadline o'tgan) SOS'larni
 *     org_departments.parent_id bo'ylab keyingi darajaga (usta→bo'lim→direktor) ko'taradi.
 *   - resolve: SOS hal qilindi → eskalatsiya to'xtaydi.
 *   Result<T> qaytaradi; raw throw yo'q.
 */

import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { MesSosEscalationRepository } from '../infrastructure/repositories/mes-sos-escalation.repo';

@Injectable()
export class MesSosEscalationService {
  private readonly logger = new Logger(MesSosEscalationService.name);

  constructor(private readonly repo: MesSosEscalationRepository) {}

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

        if (!currentDeptId) {
          await this.repo.markChainExhausted(sosId);
          exhausted += 1;
          continue;
        }

        const parent = await this.repo.getParentDepartment(currentDeptId);
        if (!parent) {
          await this.repo.markChainExhausted(sosId);
          exhausted += 1;
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
