/**
 * @module mes-to-hr-360.event
 * @description Domain event payload. Emitted via `eventBus.publish(new MesToHr360Event(...))`
 *   when an MES session is completed (Trigger 16). HR module records 360°
 *   feedback for the operator based on the session metrics.
 *
 * PA2-18 (Wave 6): extracted from the inline string-keyed publish previously
 *   used by complete-session.handler.ts so the HR listener can subscribe via
 *   canonical `@EventsHandler(MesToHr360Event)`.
 */

export class MesToHr360Event {
  constructor(
    public readonly sessionId: number,
    public readonly operatorId: number,
    public readonly timestamp: Date,
    public readonly orderId?: number,
    public readonly quantity?: number,
    public readonly defectRate?: number,
    public readonly oee?: number,
  ) {}
}
