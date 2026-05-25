/**
 * @module approval-approved.event
 * @description Domain event published by the legacy ApprovalsService when an approval is granted.
 */

export class ApprovalApprovedEvent {
  constructor(
    public readonly approvalRequestId: number | string,
    public readonly payload: Record<string, unknown>,
  ) {}
}
