/**
 * @module erp-events.listener
 * @description DEPRECATED — Wave 4 (pilot) split this aggregate `@OnEvent`
 *   listener into four canonical `@EventsHandler(EventClass)` listeners. Each
 *   former `@OnEvent` handler now lives in its own file:
 *
 *     ERP_EVENTS.DEAL_WON          → deal-won-notification.listener.ts
 *     ERP_EVENTS.ORDER_CREATED     → order-created-notification.listener.ts
 *     ERP_EVENTS.QC_FAILED         → qc-failed-notification.listener.ts
 *     ERP_EVENTS.LMS_CERT_EXPIRED  → lms-cert-expired-notification.listener.ts
 *
 *   The MRO_MACHINE_STOPPED handler was previously moved out in Wave 6
 *   (see `mro-machine-stopped-notification.listener.ts`).
 *
 *   This file is retained only as a discovery breadcrumb and is no longer
 *   registered as a NestJS provider. Delete in the final retirement commit
 *   once every consumer has migrated off the `ErpEventsListener` symbol.
 */

export {};
