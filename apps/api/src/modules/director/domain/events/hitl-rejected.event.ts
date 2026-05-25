/**
 * @module hitl-rejected.event
 * @description Domain event published when a HITL approval request is rejected.
 */

export class HitlRejectedEvent {
  constructor(
    public readonly id: string,
    public readonly documentType: string,
    public readonly documentId: string,
    public readonly rejectedBy: string,
    public readonly rejectedAt: Date | null,
    public readonly reason: string | undefined,
  ) {}
}
