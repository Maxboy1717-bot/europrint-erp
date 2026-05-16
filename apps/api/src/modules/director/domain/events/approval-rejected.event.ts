/**
 * @module approval-rejected.event
 * @description Domain event published by the legacy ApprovalsService when an approval is rejected.
 */

export class ApprovalRejectedEvent {
  constructor(
    public readonly approvalRequestId: number | string,
    public readonly payload: Record<string, unknown>,
  ) {}
}
