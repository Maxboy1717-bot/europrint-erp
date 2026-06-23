/**
 * @module so-design-requested.listener
 * @description Golden-thread SD→Design auto-trigger (Trigger 3).
 *
 *   When a sales order is created with `designFlag`, create-order.handler writes
 *   a durable outbox row `event_name = ERP_EVENTS.SO_DESIGN_REQUESTED` and also
 *   direct-publishes `{eventName:'DesignRequired'}` on the CQRS bus. The
 *   OutboxPublisher tick and the EventBridge both re-emit on the canonical
 *   EventEmitter2 topic, so this listener fires from either path — hence the
 *   repository call is idempotent on the sales order link (no duplicate task).
 *
 *   Previously this was a log-only stub bound to a CQRS event class that nobody
 *   published, so a sales order needing design produced no design task. Now it
 *   really creates the task in `design_orders`.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import {
  DESIGN_ORDERS_SVC_REPO,
  type IDesignOrdersSvcRepository,
} from '../../orders/i-design-orders-svc.repo';

interface SoDesignRequestedPayload {
  orderId?: number | string;
  aggregateId?: number | string;
  salesOrderId?: number | string;
  at?: string;
}

@Injectable()
export class SoDesignRequestedListener {
  private readonly logger = new Logger(SoDesignRequestedListener.name);

  constructor(
    @Inject(DESIGN_ORDERS_SVC_REPO) private readonly repo: IDesignOrdersSvcRepository,
  ) {}

  @OnEvent(ERP_EVENTS.SO_DESIGN_REQUESTED)
  async handle(payload: SoDesignRequestedPayload): Promise<void> {
    try {
      // Outbox payload is {orderId, at}; the direct EventBridge payload carries
      // aggregateId — accept either so both trigger paths resolve the sales order.
      const raw = payload?.orderId ?? payload?.aggregateId ?? payload?.salesOrderId;
      if (raw === undefined || raw === null) {
        this.logger.warn({ payload }, 'SO design requested without order id — skipped');
        return;
      }
      const soId = String(raw);

      const ensured = await this.repo.ensureForSalesOrder(soId, {
        orderNumber: `DZ-SO-${soId}`,
        title: `Dizayn topshirig'i — sotuv buyurtmasi #${soId}`,
      });
      if (!ensured.ok) {
        this.logger.error(
          { salesOrderId: soId, error: ensured.error },
          'SO design requested — auto-create failed',
        );
        return;
      }

      this.logger.log(
        { salesOrderId: soId, designOrderId: ensured.data.id, created: ensured.data.created },
        ensured.data.created
          ? 'Trigger 3: design task auto-created from sales order'
          : 'Trigger 3: design task already existed (idempotent skip)',
      );
    } catch (error: unknown) {
      this.logger.error({ error, payload }, 'SO design requested listener error');
    }
  }
}
