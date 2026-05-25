/**
 * @module hitl-approved.event
 * @description Domain event published when a HITL approval request is approved.
 */

export class HitlApprovedEvent {
  constructor(
    public readonly id: string,
    public readonly documentType: string,
    public readonly documentId: string,
    public readonly approvedBy: string,
    public readonly approvedAt: Date | null,
    public readonly notes: string | undefined,
  ) {}
}
