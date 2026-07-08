/**
 * @module pp-planning.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { safeCall, Result, AppError } from '@common/result';
import { PP_PLANNING_REPO, type IPpPlanningRepo } from '../domain/repositories/i-pp-planning.repo';
import { PpCancelledEvent } from '../domain/events/pp-cancelled.event';

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

  async updateOperation(id: number, body: Record<string, unknown>) {
    return safeCall(async () => {
      const result = await this.repo.updateOperation(id, body);
      // Golden-thread gap fix: cancelling a planning operation (production_orders
      // row) previously never told SD — sales_orders stayed in whatever status it
      // was in. Publish PpCancelledEvent so SdModule's listener can put the
      // linked sales order on hold. sales_order_id comes straight off the repo's
      // `RETURNING *` row — no extra query needed.
      if (result.ok && body.status === 'cancelled' && result.data) {
        const salesOrderIdRaw = (result.data as Record<string, unknown>).sales_order_id;
        const salesOrderId = Number(salesOrderIdRaw);
        if (Number.isFinite(salesOrderId) && salesOrderId > 0) {
          this.eventBus.publish(new PpCancelledEvent(id, salesOrderId));
        } else {
          this.logger.log(
            { poId: id, salesOrderIdRaw },
            'PP operation cancelled but no linked sales_order_id — nothing to notify',
          );
        }
      }
      return result;
    });
  }
}
