/**
 * @module action-approved.event
 * @description Emitted when the Director confirms a high-stake action via voice or PIN.
 */

export class ActionApprovedEvent {
  static readonly NAME = 'aisha.action.approved';
  constructor(
    public readonly conversationId: string,
    public readonly toolCallId: string,
    public readonly approvedAt: Date,
  ) {}
}
