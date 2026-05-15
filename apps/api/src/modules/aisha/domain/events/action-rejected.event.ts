/**
 * @module action-rejected.event
 * @description Emitted when the Director cancels a pending high-stake action.
 */

export class ActionRejectedEvent {
  static readonly NAME = 'aisha.action.rejected';
  constructor(
    public readonly conversationId: string,
    public readonly toolCallId: string,
    public readonly reason: string,
  ) {}
}
