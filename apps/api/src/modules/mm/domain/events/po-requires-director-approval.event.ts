/**
 * @module po-requires-director-approval.event
 * @description CQRS class event: a purchase order exceeding the HITL threshold needs director approval.
 * Was previously published as a raw STRING ('PO_REQUIRES_DIRECTOR_APPROVAL') which the CQRS EventBus
 * cannot route to any @EventsHandler (0-listener). Now a class so PoRequiresDirectorApprovalListener
 * records it to hitl_approvals (the director dashboard reads that table).
 */
export class PoRequiresDirectorApprovalEvent {
  constructor(
    public readonly poId: number,
    public readonly totalAmount: number,
    public readonly requestedBy: number,
  ) {}
}
