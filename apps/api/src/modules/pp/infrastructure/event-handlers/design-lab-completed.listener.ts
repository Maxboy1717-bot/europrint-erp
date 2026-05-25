/**
 * @module design-lab-completed.listener
 * @description DEPRECATED — Wave 4 round-2 (PA2-18) split this aggregate
 *   `@OnEvent` listener into two canonical `@EventsHandler(EventClass)`
 *   listeners. Each former `@OnEvent` handler now lives in its own file:
 *
 *     ERP_EVENTS.DESIGN_APPROVED   → design-approved-trigger5.listener.ts
 *     ERP_EVENTS.LAB_TEST_PASSED   → lab-test-passed-trigger5.listener.ts
 *
 *   The shared join-check + SQL was extracted to `design-lab-join.service.ts`.
 *
 *   This file is retained only as a discovery breadcrumb and is no longer
 *   registered as a NestJS provider. Delete in the final retirement commit
 *   once every consumer has migrated off the `DesignLabCompletedListener`
 *   symbol.
 */

export {};
