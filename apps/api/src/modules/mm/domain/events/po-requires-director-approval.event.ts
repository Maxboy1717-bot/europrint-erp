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
    /**
     * Why the PO needs director sign-off, as a comma-joined machine tag:
     * 'amount_over_threshold' (PO > po_max_amount_uzs) and/or 'low_vendor_rating'
     * (vendors.rating_low_flag=TRUE). Defaults to the amount reason for back-compat.
     */
    public readonly reason: string = 'amount_over_threshold',
  ) {}
}
