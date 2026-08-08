/**
 * @module order-material-waiting.event
 * @description CQRS class event — SD→MM material-waiting signal (golden-thread
 *   extension, T8-07).
 *
 * WHY THIS EVENT EXISTS
 *   When the advance is approved and SD dispatches the warehouse department job
 *   (AdvanceApprovedFanoutListener → createMaterialRequirementJob), an
 *   `ow_material_requirements` row is created with status 'NEEDED'. Until now
 *   that INSERT was silent: MM (procurement) got NO signal that an order is
 *   waiting for material, so the buyer never saw the demand unless a separate
 *   reorder-point (ROP) threshold happened to trip. The order could sit in
 *   'NEEDED' indefinitely with nobody alerted to procure the roll/material.
 *
 *   This event closes that gap. SD publishes `OrderMaterialWaitingEvent` on the
 *   CQRS EventBus the moment the order's material requirement is created. The
 *   OutboxEventWriter (subscribed to the same bus) atomically persists it to
 *   `domain_events` — keeping the golden thread (SD→…→MM) durable/replayable —
 *   and the MM-side `OrderMaterialWaitingListener` reacts by raising the
 *   procurement signal (a source-tagged purchase requisition draft) so the
 *   buyer's dashboard surfaces the waiting order.
 *
 * Plain class (not a DomainEvent subclass) to match the canonical MM/SD CQRS
 * event convention (AdvanceApprovedEvent, ThreeWayMatchFailedEvent, …): the
 * CQRS EventBus routes by class identity to `@EventsHandler(OrderMaterialWaitingEvent)`.
 */

export class OrderMaterialWaitingEvent {
  constructor(
    /** sd_sales_orders.id — the order whose material is being awaited. */
    public readonly orderId: number,
    /** How many ow_material_requirements rows the order now carries (≥ 1). */
    public readonly requirementCount: number,
  ) {}
}
