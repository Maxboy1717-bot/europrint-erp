/**
 * @module conversation.aggregate
 * @description Conversation aggregate root. Tracks the lifecycle of one AIsha
 * voice session and emits domain events for every meaningful state change.
 * Events are collected on `domainEvents` so handlers can publish them via
 * the EventBus once persistence succeeds (outbox pattern).
 */

import { randomUUID } from 'node:crypto';
import { Result, Ok, Err, AppErr } from '@common/result';
import type { VoiceCommand } from '../value-objects/voice-command.vo';
import type { ToolCall } from '../value-objects/tool-call.vo';
import { ConversationStartedEvent } from '../events/conversation-started.event';
import { CommandRecognizedEvent } from '../events/command-recognized.event';
import { ToolExecutedEvent } from '../events/tool-executed.event';

export type ConversationStatus = 'active' | 'ended';

interface ConversationState {
  id:        string;
  userId:    number;
  status:    ConversationStatus;
  startedAt: Date;
  endedAt:   Date | null;
  commands:  VoiceCommand[];
  toolCalls: ToolCall[];
}

type DomainEvent =
  | ConversationStartedEvent
  | CommandRecognizedEvent
  | ToolExecutedEvent;

export class Conversation {
  private state: ConversationState;
  private events: DomainEvent[] = [];

  private constructor(state: ConversationState) {
    this.state = state;
  }

  static start(input: { userId: number; nowMs?: number }): Result<Conversation> {
    if (!Number.isInteger(input.userId) || input.userId <= 0) {
      return Err(AppErr('VALIDATION', 'Conversation: userId musbat butun son bo\'lishi kerak'));
    }
    const id = randomUUID();
    const startedAt = new Date(input.nowMs ?? Date.now());
    const conv = new Conversation({
      id, userId: input.userId,
      status: 'active', startedAt, endedAt: null,
      commands: [], toolCalls: [],
    });
    conv.events.push(new ConversationStartedEvent(id, input.userId, startedAt));
    return Ok(conv);
  }

  addCommand(cmd: VoiceCommand): Result<void> {
    if (this.state.status !== 'active') {
      return Err(AppErr('INVALID_STATUS', 'Conversation: tugagan sessiyaga buyruq qo\'shib bo\'lmaydi'));
    }
    this.state.commands.push(cmd);
    this.events.push(new CommandRecognizedEvent(this.state.id, cmd));
    return Ok();
  }

  executeTool(call: ToolCall, latencyMs: number): Result<void> {
    if (this.state.status !== 'active') {
      return Err(AppErr('INVALID_STATUS', 'Conversation: tugagan sessiyada tool ishlatib bo\'lmaydi'));
    }
    if (latencyMs < 0) {
      return Err(AppErr('VALIDATION', 'Conversation: latencyMs manfiy bo\'lmasligi kerak'));
    }
    this.state.toolCalls.push(call);
    this.events.push(new ToolExecutedEvent(this.state.id, call, latencyMs));
    return Ok();
  }

  end(nowMs?: number): Result<void> {
    if (this.state.status === 'ended') {
      return Err(AppErr('INVALID_STATUS', 'Conversation: allaqachon tugatilgan'));
    }
    this.state.status = 'ended';
    this.state.endedAt = new Date(nowMs ?? Date.now());
    return Ok();
  }

  get id():        string             { return this.state.id; }
  get userId():    number             { return this.state.userId; }
  get status():    ConversationStatus { return this.state.status; }
  get commands():  ReadonlyArray<VoiceCommand> { return this.state.commands; }
  get toolCalls(): ReadonlyArray<ToolCall>     { return this.state.toolCalls; }

  pullDomainEvents(): DomainEvent[] {
    const drained = this.events;
    this.events = [];
    return drained;
  }
}
