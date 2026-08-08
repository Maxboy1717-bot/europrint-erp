/**
 * @module aisha-conversation.service
 * @description #15 P0 — the tool-execution loop. Drives the standard Anthropic tool-use cycle:
 *   ask Claude → if it requests tools, ACTUALLY run them (registry.execute) → feed the tool_result
 *   blocks back → repeat until Claude stops calling tools. This closes the core gap where tools were
 *   defined + offered but never executed.
 *
 *   HIGH-stake tools (send_email / send_telegram_to_team / schedule_meeting) are NOT auto-executed —
 *   the loop records a pending approval and feeds Claude an "approval required" result, honoring the
 *   E1 principle (AI proposes, human decides). Read/low-stake tools run immediately.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CLAUDE_PORT, IClaudePort, ClaudeMessage } from '../../domain/ports/i-claude-port';
import { ToolRegistry } from '../tools/tool.registry';
import { AishaHistoryRepository } from '../../infrastructure/persistence/aisha-history.repo';

/** Tools that mutate the outside world (email/telegram/calendar/kanban) — never auto-run; always confirm-gated.
 *  audit 2026-08-06 T11: assign_task did a real INSERT INTO kanban_cards without pause — added here. */
const HIGH_STAKE_TOOLS = new Set(['send_email', 'send_telegram_to_team', 'schedule_meeting', 'assign_task', 'execute_erp_action']);
const MAX_TOOL_ITERATIONS = 8;

export interface AishaToolRun {
  name:   string;
  ok:     boolean;
  result: unknown;
}

export interface AishaPendingApproval {
  toolUseId: string;
  name:      string;
  input:     Record<string, unknown>;
  stake:     'high';
}

export interface AishaTurnResult {
  conversationId:   string;
  reply:            string;
  toolsUsed:        string[];
  toolResults:      AishaToolRun[];
  pendingApprovals: AishaPendingApproval[];
}

@Injectable()
export class AishaConversationService {
  private readonly logger = new Logger(AishaConversationService.name);

  constructor(
    @Inject(CLAUDE_PORT) private readonly claude: IClaudePort,
    private readonly tools: ToolRegistry,
    private readonly history: AishaHistoryRepository,
  ) {}

  /**
   * Run one user turn through the full tool-use loop. Persists the turn:
   * a conversation row (created on the first message), a transcript row for the
   * user text, one tool_call row per executed/proposed tool, and a
   * pending_approval row for each high-stake tool that paused for HITL.
   *
   * Returns the final reply plus provenance (which tools ran + their real data),
   * any high-stake tools awaiting human approval, and the persisted
   * conversationId so the caller can correlate the transcript.
   */
  async runTurn(userId: number, role: string | null, userMessage: string, system: string): Promise<Result<AishaTurnResult, AppError>> {
    return safeCall(async () => {
      const ctx = { userId, role };
      const conversationId = await this.startConversation(userId, userMessage);
      const toolDefs = this.tools.size() > 0
        ? (this.tools.getDefinitions() as unknown as Array<Record<string, unknown>>)
        : undefined;
      const messages: ClaudeMessage[] = [{ role: 'user', content: userMessage }];
      let reply = '';
      const toolsUsed: string[] = [];
      const toolResults: AishaToolRun[] = [];
      const pendingApprovals: AishaPendingApproval[] = [];

      for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
        const turnR = await this.claude.createWithTools({ messages, system, tools: toolDefs });
        if (!turnR.ok) throw new Error(turnR.error.message);
        const turn = turnR.data;
        if (turn.text) reply += (reply ? '\n' : '') + turn.text;

        const toolUses = Array.isArray(turn.toolUses) ? turn.toolUses : [];
        if (toolUses.length === 0) break; // end_turn → final answer

        // Assistant turn: text + the tool_use blocks (must be echoed back so tool_result references resolve).
        const assistantContent: Array<Record<string, unknown>> = [];
        if (turn.text) assistantContent.push({ type: 'text', text: turn.text });
        for (const tu of toolUses) assistantContent.push({ type: 'tool_use', id: tu.id, name: tu.name, input: tu.input });
        messages.push({ role: 'assistant', content: assistantContent });

        const resultBlocks: Array<Record<string, unknown>> = [];
        let paused = false;
        for (const tu of toolUses) {
          toolsUsed.push(tu.name);
          if (HIGH_STAKE_TOOLS.has(tu.name)) {
            paused = true;
            pendingApprovals.push({ toolUseId: tu.id, name: tu.name, input: tu.input, stake: 'high' });
            await this.persistPendingApproval(conversationId, tu.name, tu.input);
            resultBlocks.push({ type: 'tool_result', tool_use_id: tu.id, is_error: false,
              content: `APPROVAL_REQUIRED: "${tu.name}" yuqori xavfli amal — inson tasdig'ini kutmoqda, avtomatik bajarilmadi (E1).` });
            continue;
          }
          const toolR = this.tools.getToolByName(tu.name);
          if (!toolR.ok) {
            resultBlocks.push({ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: `unknown tool: ${tu.name}` });
            continue;
          }
          const startMs = Date.now();
          const exec = await toolR.data.execute(tu.input, ctx);   // REAL execution
          const latencyMs = Date.now() - startMs;
          const payload = exec.ok ? exec.data : exec.error;
          toolResults.push({ name: tu.name, ok: exec.ok, result: payload });
          await this.persistToolCall(conversationId, tu.name, tu.input, payload, exec.ok, latencyMs);
          resultBlocks.push({ type: 'tool_result', tool_use_id: tu.id, is_error: !exec.ok, content: JSON.stringify(payload) });
        }
        messages.push({ role: 'user', content: resultBlocks });

        // A high-stake tool was requested → stop and wait for human approval (do not keep looping/auto-running).
        if (paused) break;
      }

      return { conversationId, reply: reply.trim(), toolsUsed, toolResults, pendingApprovals };
    });
  }

  /** Create the conversation + transcript row. Persistence failures are logged, not fatal. */
  private async startConversation(userId: number, userMessage: string): Promise<string> {
    const convR = await this.history.insertConversation(userId);
    if (!convR.ok) {
      this.logger.error({ userId, error: convR.error.message }, 'AIsha: conversation INSERT failed');
      throw new Error(convR.error.message);
    }
    const conversationId = convR.data.id;
    const trR = await this.history.insertTranscript(conversationId, userMessage);
    if (!trR.ok) this.logger.warn({ conversationId, error: trR.error.message }, 'AIsha: transcript INSERT failed (non-fatal)');
    return conversationId;
  }

  /** Persist one executed tool call. Logged, non-fatal — a DB hiccup must not break the chat reply. */
  private async persistToolCall(conversationId: string, name: string, input: Record<string, unknown>, output: unknown, ok: boolean, latencyMs: number): Promise<void> {
    const r = await this.history.insertToolCall({
      conversationId, toolName: name, input, output,
      source: ok ? 'tool' : 'tool_error', latencyMs,
    });
    if (!r.ok) this.logger.warn({ conversationId, tool: name, error: r.error.message }, 'AIsha: tool_call INSERT failed (non-fatal)');
  }

  /** Persist a high-stake tool as a tool_call (output=null) then a pending_approval referencing it. */
  private async persistPendingApproval(conversationId: string, name: string, input: Record<string, unknown>): Promise<void> {
    const tcR = await this.history.insertToolCall({
      conversationId, toolName: name, input, output: null,
      source: 'pending_approval', latencyMs: null,
    });
    if (!tcR.ok) {
      this.logger.warn({ conversationId, tool: name, error: tcR.error.message }, 'AIsha: HITL tool_call INSERT failed (non-fatal)');
      return;
    }
    const paR = await this.history.insertPendingApproval(conversationId, tcR.data.id);
    if (!paR.ok) this.logger.warn({ conversationId, tool: name, error: paR.error.message }, 'AIsha: pending_approval INSERT failed (non-fatal)');
  }
}
