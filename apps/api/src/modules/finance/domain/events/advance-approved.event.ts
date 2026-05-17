/**
 * @module advance-approved.event
 * @description Domain event payload. Emitted via `eventBus.publish(new AdvanceApprovedEvent(...))`
 *   after the FI tech-three checkpoint passes and the advance is paid in full
 *   (Trigger 7). PP listens to unlock production planning.
 *
 * PA2-18 (Wave 6): extracted from the inline string-keyed
 *   `events.emit(ERP_EVENTS.ADVANCE_APPROVED, ...)` previously used by
 *   finance/tech-three-checkpoint.listener.ts so the PP listener can subscribe
 *   via canonical `@EventsHandler(AdvanceApprovedEvent)`.
 */

export class AdvanceApprovedEvent {
  constructor(
    public readonly orderId: number,
    public readonly advancePaid: number,
    public readonly advancePct: number,
    public readonly advanceId?: number,
  ) {}
}
