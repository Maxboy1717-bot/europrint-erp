/**
 * @module conversation-started.event
 * @description Domain event emitted when a new AIsha voice session begins.
 */

export class ConversationStartedEvent {
  static readonly NAME = 'aisha.conversation.started';
  constructor(
    public readonly conversationId: string,
    public readonly userId: number,
    public readonly startedAt: Date,
  ) {}
}
