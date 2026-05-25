/**
 * @module lms-cert-expired.listener
 * @description DEPRECATED — Wave 4 round-2 (PA2-18) split this aggregate
 *   `@OnEvent` listener into two canonical `@EventsHandler(EventClass)`
 *   listeners. Each former `@OnEvent` handler now lives in its own file:
 *
 *     ERP_EVENTS.LMS_CERT_EXPIRED       → lms-cert-expired-mes.listener.ts
 *     ERP_EVENTS.LMS_CERT_EXPIRED_LIVE  → lms-cert-expired-live-mes.listener.ts
 *
 *   The shared deactivate-skill + logging was extracted to
 *   `lms-cert-expired-block.service.ts`.
 *
 *   This file is retained only as a discovery breadcrumb and is no longer
 *   registered as a NestJS provider. Delete in the final retirement commit
 *   once every consumer has migrated off the `LmsCertExpiredListener`
 *   symbol.
 */

export {};
