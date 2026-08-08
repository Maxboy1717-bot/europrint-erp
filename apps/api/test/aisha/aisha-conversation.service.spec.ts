/**
 * aisha-conversation.service.spec.ts — #15 P0 tool-execution loop.
 *
 * Proves the core gap is closed: a tool Claude requests ACTUALLY runs (tool.execute called, real result
 * fed back as a tool_result), and a HIGH-stake tool PAUSES for approval instead of auto-executing.
 * Claude is mocked (deterministic); the tool's execute() is the real-execution surface.
 */

import { AishaConversationService } from '../../src/modules/aisha/application/conversation/aisha-conversation.service';
import { Ok } from '../../src/common/result';
import type { ClaudeRequest } from '../../src/modules/aisha/domain/ports/i-claude-port';

function makeClaude(turns: Array<{ text: string; toolUses: Array<{ id: string; name: string; input: Record<string, unknown> }> }>) {
  let i = 0;
  const calls: ClaudeRequest[] = [];
  return {
    calls,
    createWithTools: jest.fn(async (req: ClaudeRequest) => {
      calls.push(req);
      const t = turns[Math.min(i, turns.length - 1)];
      i++;
      return Ok({ text: t.text, toolUses: t.toolUses, stopReason: t.toolUses.length ? 'tool_use' : 'end_turn' });
    }),
    streamWithTools: jest.fn(),
    sendOneShot: jest.fn(),
  };
}

describe('AishaConversationService.runTurn — #15 P0 tool loop', () => {
  it('EXECUTES a requested read tool and feeds its real result back into the answer', async () => {
    const execute = jest.fn(async (input: Record<string, unknown>) =>
      Ok({ data: { activeAlerts: 3, fromInput: input.area ?? null }, provenance: { source: 'iot_alerts', at: 't' } }));
    const registry = {
      size: () => 1,
      getDefinitions: () => [{ name: 'get_active_alerts' }],
      getToolByName: jest.fn((name: string) =>
        name === 'get_active_alerts' ? Ok({ definition: { name }, execute }) : { ok: false, error: { code: 'NOT_FOUND', message: 'x' } }),
    };
    const svc = new AishaConversationService(makeClaude([
      { text: 'Tekshiryapman...', toolUses: [{ id: 'tu_1', name: 'get_active_alerts', input: { area: 'gofra' } }] },
      { text: '3 ta faol ogohlantirish bor.', toolUses: [] },
    ]) as never, registry as never);

    const r = await svc.runTurn('Hozir nechta faol ogohlantirish bor?', 'SYS');
    expect(r.ok).toBe(true);
    if (r.ok) {
      // the tool ACTUALLY ran with Claude's input
      expect(execute).toHaveBeenCalledWith({ area: 'gofra' });
      expect(r.data.toolsUsed).toContain('get_active_alerts');
      // real result captured in provenance + fed back (no pending approval for a read tool)
      expect(r.data.toolResults).toEqual([{ name: 'get_active_alerts', ok: true, result: { data: { activeAlerts: 3, fromInput: 'gofra' }, provenance: { source: 'iot_alerts', at: 't' } } }]);
      expect(r.data.pendingApprovals).toHaveLength(0);
      expect(r.data.reply).toContain('3 ta faol ogohlantirish');
    }
  });

  it('PAUSES a HIGH-stake tool (send_telegram_to_team) for approval — does NOT auto-execute', async () => {
    const execute = jest.fn();
    const registry = {
      size: () => 1,
      getDefinitions: () => [{ name: 'send_telegram_to_team' }],
      getToolByName: jest.fn(() => Ok({ definition: { name: 'send_telegram_to_team' }, execute })),
    };
    const svc = new AishaConversationService(makeClaude([
      { text: 'Xabar tayyorladim.', toolUses: [{ id: 'tu_hi', name: 'send_telegram_to_team', input: { text: 'Reja tayyor' } }] },
    ]) as never, registry as never);

    const r = await svc.runTurn("Jamoaga 'reja tayyor' deb yoz", 'SYS');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(execute).not.toHaveBeenCalled();             // NOT auto-sent
      expect(r.data.toolResults).toHaveLength(0);          // nothing executed
      expect(r.data.pendingApprovals).toEqual([{ toolUseId: 'tu_hi', name: 'send_telegram_to_team', input: { text: 'Reja tayyor' }, stake: 'high' }]);
    }
  });

  it('returns a direct answer when Claude needs no tool', async () => {
    const registry = { size: () => 0, getDefinitions: () => [], getToolByName: jest.fn() };
    const svc = new AishaConversationService(makeClaude([{ text: 'Salom! Qanday yordam beraman?', toolUses: [] }]) as never, registry as never);
    const r = await svc.runTurn('Salom', 'SYS');
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.data.reply).toContain('Salom'); expect(r.data.toolResults).toHaveLength(0); }
  });
});
