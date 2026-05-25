/**
 * @module mes-completed.event
 * @description Domain event payload. Emitted via `eventBus.publish(new MesCompletedEvent(...))`
 *   when an MES session is completed (Trigger 10) → QC pickup.
 *
 * PA2-18 (Wave 6): extracted from the inline string-keyed publish previously
 *   used by complete-session.handler.ts so the QC listener can subscribe via
 *   canonical `@EventsHandler(MesCompletedEvent)`.
 */

export class MesCompletedEvent {
  constructor(
    public readonly sessionId: number,
    public readonly timestamp: Date,
  ) {}
}
