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

/** Tools that mutate the outside world (email/telegram/calendar) — never auto-run; always confirm-gated. */
const HIGH_STAKE_TOOLS = new Set(['send_email', 'send_telegram_to_team', 'schedule_meeting']);
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
  ) {}

  /**
   * Run one user turn through the full tool-use loop. Returns the final reply plus provenance
   * (which tools ran + their real data) and any high-stake tools awaiting human approval.
   */
  async runTurn(userMessage: string, system: string): Promise<Result<AishaTurnResult, AppError>> {
    return safeCall(async () => {
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
            resultBlocks.push({ type: 'tool_result', tool_use_id: tu.id, is_error: false,
              content: `APPROVAL_REQUIRED: "${tu.name}" yuqori xavfli amal — inson tasdig'ini kutmoqda, avtomatik bajarilmadi (E1).` });
            continue;
          }
          const toolR = this.tools.getToolByName(tu.name);
          if (!toolR.ok) {
            resultBlocks.push({ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: `unknown tool: ${tu.name}` });
            continue;
          }
          const exec = await toolR.data.execute(tu.input);   // REAL execution
          const payload = exec.ok ? exec.data : exec.error;
          toolResults.push({ name: tu.name, ok: exec.ok, result: payload });
          resultBlocks.push({ type: 'tool_result', tool_use_id: tu.id, is_error: !exec.ok, content: JSON.stringify(payload) });
        }
        messages.push({ role: 'user', content: resultBlocks });

        // A high-stake tool was requested → stop and wait for human approval (do not keep looping/auto-running).
        if (paused) break;
      }

      return { reply: reply.trim(), toolsUsed, toolResults, pendingApprovals };
    });
  }
}
