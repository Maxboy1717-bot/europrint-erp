/**
 * @module conversation.aggregate.spec
 * @description Conversation aggregate lifecycle and event collection.
 */

import { Conversation } from '../../src/modules/aisha/domain/aggregates/conversation.aggregate';
import { VoiceCommand } from '../../src/modules/aisha/domain/value-objects/voice-command.vo';
import { ToolCall, type Provenance } from '../../src/modules/aisha/domain/value-objects/tool-call.vo';
import { ConversationStartedEvent } from '../../src/modules/aisha/domain/events/conversation-started.event';
import { CommandRecognizedEvent } from '../../src/modules/aisha/domain/events/command-recognized.event';
import { ToolExecutedEvent } from '../../src/modules/aisha/domain/events/tool-executed.event';

function mkCmd() {
  const r = VoiceCommand.create({ transcript: 'salom', language: 'uz', confidence: 0.9, durationMs: 800 });
  if (!r.ok) throw new Error('setup');
  return r.data;
}

const prov: Provenance = {
  sources: [{ type: 'database', identifier: 'sd.x', queriedAt: 'now', latencyMs: 1, freshness: 'live' }],
  confidence: 1, citations: [],
};

function mkCall() {
  const r = ToolCall.create({ toolName: 't', input: {}, output: 1, provenance: prov });
  if (!r.ok) throw new Error('setup');
  return r.data;
}

describe('Conversation', () => {
  it('starts in active status and emits ConversationStartedEvent', () => {
    const r = Conversation.start({ userId: 1 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const events = r.data.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ConversationStartedEvent);
  });

  it('rejects non-positive user id', () => {
    expect(Conversation.start({ userId: 0 }).ok).toBe(false);
    expect(Conversation.start({ userId: -1 }).ok).toBe(false);
  });

  it('addCommand emits CommandRecognizedEvent', () => {
    const r = Conversation.start({ userId: 1 });
    if (!r.ok) throw new Error('setup');
    r.data.pullDomainEvents();
    r.data.addCommand(mkCmd());
    const events = r.data.pullDomainEvents();
    expect(events[0]).toBeInstanceOf(CommandRecognizedEvent);
  });

  it('executeTool emits ToolExecutedEvent with latency', () => {
    const r = Conversation.start({ userId: 1 });
    if (!r.ok) throw new Error('setup');
    r.data.pullDomainEvents();
    r.data.executeTool(mkCall(), 234);
    const events = r.data.pullDomainEvents();
    expect(events[0]).toBeInstanceOf(ToolExecutedEvent);
  });

  it('rejects executeTool with negative latency', () => {
    const r = Conversation.start({ userId: 1 });
    if (!r.ok) throw new Error('setup');
    expect(r.data.executeTool(mkCall(), -1).ok).toBe(false);
  });

  it('end transitions to ended status', () => {
    const r = Conversation.start({ userId: 1 });
    if (!r.ok) throw new Error('setup');
    expect(r.data.end().ok).toBe(true);
    expect(r.data.status).toBe('ended');
  });

  it('rejects addCommand after end', () => {
    const r = Conversation.start({ userId: 1 });
    if (!r.ok) throw new Error('setup');
    r.data.end();
    expect(r.data.addCommand(mkCmd()).ok).toBe(false);
  });

  it('rejects double end', () => {
    const r = Conversation.start({ userId: 1 });
    if (!r.ok) throw new Error('setup');
    r.data.end();
    expect(r.data.end().ok).toBe(false);
  });
});
