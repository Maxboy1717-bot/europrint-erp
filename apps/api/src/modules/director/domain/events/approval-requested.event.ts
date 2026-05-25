/**
 * @module approval-requested.event
 * @description Domain event published by the legacy ApprovalsService when a generic approval is created.
 */

export class ApprovalRequestedEvent {
  constructor(
    public readonly approvalRequestId: number | string,
    public readonly payload: Record<string, unknown>,
  ) {}
}
