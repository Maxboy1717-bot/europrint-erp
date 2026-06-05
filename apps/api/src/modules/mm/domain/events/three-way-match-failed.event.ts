/**
 * @module three-way-match-failed.event
 * @description CQRS class event: PO↔GR↔Invoice 3-way match failed → purchase-manager approval required.
 * Was published as a raw STRING ('THREE_WAY_MATCH_FAILED') which the CQRS EventBus cannot route to any
 * @EventsHandler (0-listener). Now a class so ThreeWayMatchFailedListener records it to hitl_approvals.
 */
export class ThreeWayMatchFailedEvent {
  constructor(
    public readonly poId: number,
    public readonly difference: number,
  ) {}
}
