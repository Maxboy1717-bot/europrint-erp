/**
 * @module domain-events.spec
 * @description Smoke tests for each AIsha domain event constructor.
 */

import { ConversationStartedEvent } from '../../src/modules/aisha/domain/events/conversation-started.event';
import { CommandRecognizedEvent } from '../../src/modules/aisha/domain/events/command-recognized.event';
import { ToolExecutedEvent } from '../../src/modules/aisha/domain/events/tool-executed.event';
import { ActionApprovedEvent } from '../../src/modules/aisha/domain/events/action-approved.event';
import { ActionRejectedEvent } from '../../src/modules/aisha/domain/events/action-rejected.event';
import { VoiceCommand } from '../../src/modules/aisha/domain/value-objects/voice-command.vo';
import { ToolCall, type Provenance } from '../../src/modules/aisha/domain/value-objects/tool-call.vo';

const prov: Provenance = {
  sources: [{ type: 'database', identifier: 'x', queriedAt: 'now', latencyMs: 1, freshness: 'live' }],
  confidence: 1, citations: [],
};

describe('AIsha domain events', () => {
  it('ConversationStartedEvent carries id, user, startedAt', () => {
    const e = new ConversationStartedEvent('c1', 7, new Date(0));
    expect(e.conversationId).toBe('c1');
    expect(e.userId).toBe(7);
  });

  it('CommandRecognizedEvent carries the VoiceCommand', () => {
    const cmd = VoiceCommand.create({ transcript: 'hi', language: 'uz', confidence: 1, durationMs: 1 });
    if (!cmd.ok) throw new Error('setup');
    const e = new CommandRecognizedEvent('c1', cmd.data);
    expect(e.command.props.transcript).toBe('hi');
  });

  it('ToolExecutedEvent carries the ToolCall and latency', () => {
    const tc = ToolCall.create({ toolName: 't', input: {}, output: null, provenance: prov });
    if (!tc.ok) throw new Error('setup');
    const e = new ToolExecutedEvent('c1', tc.data, 99);
    expect(e.latencyMs).toBe(99);
  });

  it('ActionApprovedEvent carries the toolCallId', () => {
    const e = new ActionApprovedEvent('c1', 'tc1', new Date(0));
    expect(e.toolCallId).toBe('tc1');
  });

  it('ActionRejectedEvent carries the reason', () => {
    const e = new ActionRejectedEvent('c1', 'tc1', 'cancelled by user');
    expect(e.reason).toContain('cancelled');
  });
});
