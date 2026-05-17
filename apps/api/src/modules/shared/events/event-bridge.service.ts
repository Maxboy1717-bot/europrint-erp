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
  // Wave 4 (pilot) additions — keep legacy string-topic consumers alive
  // while the notifications module migrates to @EventsHandler(EventClass).
  // Remove these entries in the final retirement commit once every consumer
  // listens on the event class directly.
  OrderCreatedEvent: ERP_EVENTS.ORDER_CREATED,
  QcFailedEvent: ERP_EVENTS.QC_FAILED,
  CertificateExpiredEvent: ERP_EVENTS.LMS_CERT_EXPIRED,
  // Wave 4 round-2 additions — pp + mes listeners migrated off @OnEvent.
  DesignApprovedEvent: ERP_EVENTS.DESIGN_APPROVED,
  LabTestPassedEvent: ERP_EVENTS.LAB_TEST_PASSED,
  CertificateExpiredLiveEvent: ERP_EVENTS.LMS_CERT_EXPIRED_LIVE,
  // Wave 4 round-3 additions — crm/sd/hr/ai listeners migrated off @OnEvent.
  WebsiteOrderCreatedEvent: ERP_EVENTS.WEBSITE_ORDER_CREATED,
  WebsiteContactSubmittedEvent: ERP_EVENTS.WEBSITE_CONTACT_SUBMITTED,
  // InvoiceFullyPaidEvent already mapped above (pilot).
  // HR document-workflow — these are not in ERP_EVENTS, they use the
  // hr-v2-events.ts namespace. Mapped to the literal string topics so
  // legacy @OnEvent consumers (gamification, telegram-bots) keep firing.
  DocumentSubmittedEvent: 'document.submitted',
  DocumentApprovedEvent: 'document.approved',
  DocumentRejectedEvent: 'document.rejected',
  // HR skills-matrix — certificate-earned dead-letter handler, but bridged
  // defensively for the day a publisher is wired.
  CertificateEarnedEvent: 'training.certificate.earned',
  // AI automation — all three are dead-letter today, kept defensively.
  CrmLeadCreatedEvent: 'crm.lead.created',
  HrCandidateAddedEvent: 'hr.candidate.added',
  FinanceInvoiceCreatedEvent: 'finance.invoice.created',
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
