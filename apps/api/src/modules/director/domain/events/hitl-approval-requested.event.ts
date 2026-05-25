/**
 * @module hitl-approval-requested.event
 * @description Domain event published when a HITL approval request is created.
 */

export class HitlApprovalRequestedEvent {
  constructor(
    public readonly id: string,
    public readonly documentType: string,
    public readonly documentId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly requestedBy: string,
    public readonly createdAt: Date,
  ) {}
}
