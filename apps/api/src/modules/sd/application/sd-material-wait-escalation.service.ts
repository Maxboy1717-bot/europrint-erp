/**
 * @module sd-material-wait-escalation.service
 * @description 06-sd #2 orchestration — MaterialRequiredEvent + MM reject / 24h→48h
 *   escalation. The initial material-wait signal already flows via
 *   OrderMaterialWaitingEvent → OutboxEventWriter → domain_events (built); this
 *   service adds the MISSING half: when a material-wait review item is MM-rejected
 *   OR sits unanswered past 24h, the order is parked in 'material-wait' (Ожд.Сырьё)
 *   and escalated 24h→sales_manager, 48h→director (vision-given fixed defaults; no
 *   owner data). Idempotent — safe to re-run hourly. Result<T>; delegates all DB to
 *   the repo (Qoida 15).
 */

import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result } from '@common/result';
import {
  DrizzleSdMaterialWaitEscalationRepo,
  OverdueMaterialWaitRow,
} from '../infrastructure/repositories/drizzle-sd-material-wait-escalation.repo';

/** Vision 06-sd #2 fixed escalation thresholds (owner-tunable later; no owner data now). */
const ESCALATION_L1_HOURS = 24; // → sales manager
const ESCALATION_L2_HOURS = 48; // → director
const ROLE_BY_LEVEL: Record<number, string> = { 1: 'sales_manager', 2: 'director' };

@Injectable()
export class SdMaterialWaitEscalationService {
  private readonly logger = new Logger(SdMaterialWaitEscalationService.name);

  constructor(private readonly repo: DrizzleSdMaterialWaitEscalationRepo) {}

  /**
   * Sweep overdue/rejected material-wait review items and escalate each up to its
   * target level, skipping levels already recorded (idempotent). Returns counters.
   */
  async escalateOverdue(): Promise<Result<{ scanned: number; escalated: number }>> {
    return safeCall(async () => {
      const found = await this.repo.findOverdue(ESCALATION_L1_HOURS);
      if (!found.ok) throw new Error(found.error.message);
      const rows: OverdueMaterialWaitRow[] = Array.isArray(found.data) ? found.data : [];

      let escalated = 0;
      for (const row of rows) {
        const orderId = Number(row.sales_order_id);
        if (!orderId) continue;
        const ageHours = Number(row.age_hours ?? 0);
        const currentLevel = Number(row.current_level ?? 0);
        // MM-rejected → at least level 1 immediately; otherwise age drives the level.
        const targetLevel = ageHours >= ESCALATION_L2_HOURS ? 2 : 1;

        for (let level = currentLevel + 1; level <= targetLevel; level += 1) {
          const notifyRole = ROLE_BY_LEVEL[level] ?? 'sales_manager';
          const rec = await this.repo.recordEscalation({
            salesOrderId: orderId,
            hitlApprovalId: row.hitl_approval_id ?? null,
            level,
            notifyRole,
            reason:
              row.review_status === 'rejected'
                ? `MM material talabini rad etdi (buyurtma #${orderId})`
                : `Material ${ageHours} soatdan beri kutmoqda (buyurtma #${orderId})`,
            ageHours,
          });
          if (!rec.ok) throw new Error(rec.error.message);
          if (!rec.data.created) continue; // already escalated at this level (idempotent)

          await this.repo.markOrderMaterialWait(orderId);
          await this.repo.emitEscalationEvent(orderId, level, notifyRole, ageHours);
          escalated += 1;
          this.logger.log(
            `06-sd#2 material-wait escalation → order #${orderId} level ${level} (${notifyRole}), age ${ageHours}h, ${row.review_status}`,
          );
        }
      }
      return { scanned: rows.length, escalated };
    }, 'DB_ERROR');
  }
}
