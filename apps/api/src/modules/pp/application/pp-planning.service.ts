/**
 * @module pp-planning.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { safeCall, Result, AppError } from '@common/result';
import { PP_PLANNING_REPO, type IPpPlanningRepo } from '../domain/repositories/i-pp-planning.repo';
import { PpCancelledEvent } from '../domain/events/pp-cancelled.event';
import { CcSpawnRequestedEvent } from '../../communication-center/domain/events/cc-spawn-requested.event';

@Injectable()
export class PpPlanningService {
  private readonly logger = new Logger(PpPlanningService.name);

  constructor(
    @Inject(PP_PLANNING_REPO) private readonly repo: IPpPlanningRepo,
    private readonly eventBus: EventBus,
  ) {}

  async getSchedule(start: string, end: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      return this.repo.getSchedule(start, end);
    });
  }

  async createScheduleEntry(body: Record<string, unknown>, createdBy?: number) {
    return safeCall(async () => {
      return this.repo.createScheduleEntry(body, createdBy);
    });
  }

  async updateOperation(id: number, body: Record<string, unknown>, actorUserId?: number) {
    return safeCall(async () => {
      const result = await this.repo.updateOperation(id, body);
      // Golden-thread gap fix: cancelling a planning operation (production_orders
      // row) previously never told SD — sales_orders stayed in whatever status it
      // was in. Publish PpCancelledEvent so SdModule's listener can put the
      // linked sales order on hold. sales_order_id comes straight off the repo's
      // `RETURNING *` row — no extra query needed.
      if (result.ok && body.status === 'cancelled' && result.data) {
        const row = result.data as Record<string, unknown>;
        const salesOrderIdRaw = row.sales_order_id;
        const salesOrderId = Number(salesOrderIdRaw);
        if (Number.isFinite(salesOrderId) && salesOrderId > 0) {
          this.eventBus.publish(new PpCancelledEvent(id, salesOrderId));
        } else {
          this.logger.log(
            { poId: id, salesOrderIdRaw },
            'PP operation cancelled but no linked sales_order_id — nothing to notify',
          );
        }

        // Owner decision 2026-07-13 (chat): this same plan-change (operation cancelled)
        // also spawns a CC document (template PLAN_CHANGE — the exact template the
        // 2026-07-11 CC audit flagged as missing for SD/PP plan changes). senderUserId =
        // the real authenticated actor threaded from the controller (@CurrentUser, same
        // pattern the sibling createScheduleEntry method already uses); skipped when
        // absent (Q-40: no fabrication) rather than guessing an actor. Best-effort,
        // non-fatal — a CC hiccup must not break the operation-cancel write above.
        if (actorUserId != null) {
          try {
            const orderNumber = row.order_number != null ? String(row.order_number) : null;
            this.eventBus.publish(new CcSpawnRequestedEvent({
              templateCode: 'PLAN_CHANGE',
              senderUserId: actorUserId,
              subject: `Ishlab chiqarish rejasi o'zgardi — operatsiya #${id} bekor qilindi${orderNumber ? ` (${orderNumber})` : ''}`,
              body: typeof body.notes === 'string' && body.notes.trim() ? body.notes : `Ishlab chiqarish operatsiyasi #${id} bekor qilindi.`,
              priority: 'normal',
              metadata: { productionOrderId: id, salesOrderId: Number.isFinite(salesOrderId) && salesOrderId > 0 ? salesOrderId : null, orderNumber },
            }));
          } catch (e) {
            this.logger.warn(`PP operation #${id}: CC hujjat spawn xatosi (ignore) — ${String(e)}`);
          }
        }
      }
      return result;
    });
  }
}
