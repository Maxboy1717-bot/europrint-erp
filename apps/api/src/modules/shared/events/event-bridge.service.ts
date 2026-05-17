/**
 * @module event-bridge.service
 * @description Bridges @nestjs/cqrs EventBus → EventEmitter2 namespace.
 *
 * Background: three competing event-publishing mechanisms exist in this codebase
 * (CQRS EventBus, EventEmitter2 with ERP_EVENTS namespace, EventEmitter2 keyed
 * on event.eventName). Listeners use @OnEvent(ERP_EVENTS.X) while many emit
 * sites use `eventBus.publish(new SomeEvent(...))`. Without this bridge, those
 * cross-mechanism trigger pairs silently drop.
 *
 * This service subscribes to the CQRS EventBus, looks up the event's class
 * name in EVENT_NAME_MAP, and re-emits via EventEmitter2 using the canonical
 * ERP_EVENTS string. Extend EVENT_NAME_MAP when adding new CQRS-published
 * domain events that downstream listeners consume.
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventBus, IEvent } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

/** Map CQRS event class names → ERP_EVENTS string namespaces. */
const EVENT_NAME_MAP: Record<string, string> = {
  DealWonEvent: ERP_EVENTS.DEAL_WON,
  InvoiceFullyPaidEvent: ERP_EVENTS.INVOICE_FULLY_PAID,
  InvoicePartiallyPaidEvent: ERP_EVENTS.PAYMENT_FULL,
  AdvanceBypassApprovedEvent: ERP_EVENTS.ADVANCE_BYPASS_APPROVED,
  // PA2-18 Wave 5 additions
  DeliveryCompletedEvent: ERP_EVENTS.DELIVERY_COMPLETED,
  MroMaintenanceStopEvent: ERP_EVENTS.MRO_MAINTENANCE_STOP,
  WmsGoodsIssuedEvent: ERP_EVENTS.WMS_GOODS_ISSUED,
  // PA2-18 Wave 6 additions
  PpReleasedEvent: ERP_EVENTS.PP_RELEASED_TO_PRODUCTION,
  WmsFgReceivedEvent: ERP_EVENTS.WMS_FG_RECEIVED,
  MesCompletedEvent: ERP_EVENTS.MES_COMPLETED,
  MesToHr360Event: ERP_EVENTS.MES_TO_HR_360,
  StockUpdatedEvent: ERP_EVENTS.STOCK_UPDATED,
  AdvanceApprovedEvent: ERP_EVENTS.ADVANCE_APPROVED,
};

@Injectable()
export class EventBridgeService implements OnModuleInit {
  private readonly logger = new Logger(EventBridgeService.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly emitter: EventEmitter2,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe((event: IEvent) => {
      if (!event) return;

      // Resolve namespace by class name first, then fall back to event.eventName.
      const className = (event as { constructor?: { name?: string } }).constructor?.name;
      const rawName = (event as { eventName?: unknown }).eventName;
      const fallbackName = typeof rawName === 'string' ? rawName : undefined;
      const erpName =
        (className ? EVENT_NAME_MAP[className] : undefined) ??
        (fallbackName ? EVENT_NAME_MAP[fallbackName] : undefined);

      if (!erpName) {
        // Unmapped events stay on the CQRS bus only — not a failure.
        return;
      }

      try {
        this.emitter.emit(erpName, event);
      } catch (error: unknown) {
        this.logger.error({
          msg: 'EventBridge re-emit failed',
          eventClass: className,
          erpName,
          error: (error as Error).message,
        });
      }
    });
    this.logger.log('EventBridgeService initialised (CQRS → EventEmitter2 namespace bridge)');
  }
}
