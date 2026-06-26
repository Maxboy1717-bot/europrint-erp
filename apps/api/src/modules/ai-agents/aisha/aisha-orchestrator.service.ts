/**
 * @module aisha-orchestrator.service
 * @description A78 — Aisha tool-call loop SKELETON (AI-key gated).
 *
 *   This is the orchestration spine for an LLM agent that answers a query by
 *   repeatedly: asking the model what to do → running the tool the model
 *   asked for → feeding the real result back → asking again, until the model
 *   produces a final answer (or the iteration cap is hit).
 *
 *   It is intentionally a SKELETON:
 *     - Tools are registered from the outside via `registerTool()`. The loop
 *       never imports a concrete tool — the registry is the only seam. The
 *       existing `modules/aisha` ships ~30 real tools that can be adapted to
 *       the `AishaTool` contract and registered here.
 *     - The LLM transport is the shared, key-gated `AiRouterService`. When no
 *       provider key is configured, `ai.call()` returns Err and this loop
 *       returns `status: 'needs_ai_key'` with NO fabricated tool output.
 *
 * Q-40 (FABRICATION TAQIQ): the loop NEVER invents a tool result. A tool
 *   either returns real data (Ok) or a typed failure (Err); an unregistered
 *   tool yields a structured "unknown tool" observation. With no AI key the
 *   loop produces zero tool calls — there is nothing to fake.
 *
 * Q-30 (SECRET): no provider key is ever read, logged, or echoed here — key
 *   handling lives entirely inside AiRouterService.
 *
 * @layer Service (AI-agents orchestration)
 */

import { Injectable, Logger } from '@nestjs/common';
import { isErr } from '@common/result';
import { AiRouterService } from '../../ai/application/services/ai-router.service';
import type { AiTaskType } from '../../ai/domain/types/ai.types';
import { AiDecisionLogService } from '../common/ai-decision-log.service';
import { AGENT_CODES, AISHA_MAX_TOOL_ITERATIONS, AI_GEMINI_MODEL } from '../common/ai-agents.constants';
import type {
  AishaTool,
  AishaLoopResult,
  AishaLoopStep,
  AishaRunOptions,
  ToolCallRequest,
  ToolObservation,
} from './aisha-tool.types';

// The loop drives a generic "ask the model, run a tool, repeat" task. We borrow
// an existing AiTaskType so usage/budget logging stays consistent; the router
// will fall back across providers as configured.
const AISHA_TASK_TYPE: AiTaskType = 'director.strategic_recommend';

/**
 * Shape the model is asked to emit each turn. Until a provider-native tool-use
 * channel is wired, we parse this JSON envelope out of the assistant text.
 *   { "tool": "name", "args": { ... } }  → run a tool
 *   { "final": "answer text" }            → finish
 */
interface AssistantTurn {
  tool?:  string;
  args?:  Record<string, unknown>;
  final?: string;
}

@Injectable()
export class AishaOrchestratorService {
  private readonly logger = new Logger(AishaOrchestratorService.name);

  /** Registry of tools the loop may call, keyed by tool name. */
  private readonly tools = new Map<string, AishaTool>();

  constructor(
    private readonly ai:     AiRouterService,
    private readonly logSvc: AiDecisionLogService,
  ) {}

  /**
   * Register a tool the loop is allowed to invoke. Idempotent by name — a
   * second registration of the same name overwrites the first.
   */
  registerTool(tool: AishaTool): void {
    this.tools.set(tool.definition.name, tool);
  }

  /** Names of all currently-registered tools (for diagnostics / tests). */
  registeredToolNames(): string[] {
    return [...this.tools.keys()];
  }

  /**
   * Run the tool-call loop for a single user query.
   *
   * Returns a structured AishaLoopResult in ALL cases (never throws):
   *   - needs_ai_key  — no provider key; loop did not run, no tools called.
   *   - ai_error      — provider returned a non-key error (budget, 5xx).
   *   - completed     — model produced a final answer.
   *   - max_iterations— iteration cap reached before a final answer.
   */
  async run(query: string, opts: AishaRunOptions = {}): Promise<AishaLoopResult> {
    const maxIterations = opts.maxIterations ?? AISHA_MAX_TOOL_ITERATIONS;
    const steps: AishaLoopStep[] = [];
    const transcript: string[] = [`Foydalanuvchi savoli: ${query}`];
    const systemPrompt = this.buildSystemPrompt(opts.systemPrompt);

    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      const turn = await this.askModel(systemPrompt, transcript, opts.userId);
      if (turn.kind === 'needs_ai_key') {
        return this.finish('needs_ai_key', '', steps, turn.reason);
      }
      if (turn.kind === 'ai_error') {
        return this.finish('ai_error', '', steps, turn.reason);
      }

      const parsed = this.parseTurn(turn.text);

      // Final answer → loop done.
      if (parsed.final !== undefined || !parsed.tool) {
        steps.push({ iteration, assistantText: turn.text, toolCall: null, observation: null });
        const answer = parsed.final ?? turn.text;
        await this.logDecision(query, answer, steps, true, opts.userId);
        return this.finish('completed', answer, steps, null);
      }

      // Tool request → run the registered tool (real result, never faked).
      const toolCall: ToolCallRequest = {
        id:   `${iteration}-${parsed.tool}`,
        name: parsed.tool,
        args: parsed.args ?? {},
      };
      const observation = await this.runTool(toolCall);
      steps.push({ iteration, assistantText: turn.text, toolCall, observation });
      transcript.push(
        `Assistant tool so'radi: ${toolCall.name}(${JSON.stringify(toolCall.args)})`,
        `Tool natijasi (${observation.ok ? 'ok' : 'xato'}): ${JSON.stringify(observation.result)}`,
      );
    }

    await this.logDecision(query, '', steps, false, opts.userId);
    return this.finish('max_iterations', '', steps, `Iteratsiya chegarasi (${maxIterations}) ga yetdi`);
  }

  /**
   * One model turn through the key-gated router. Distinguishes a missing-key
   * failure (gate) from other provider errors so `run()` can label the outcome.
   */
  private async askModel(
    systemPrompt: string,
    transcript:   string[],
    userId?:      number,
  ): Promise<{ kind: 'ok'; text: string } | { kind: 'needs_ai_key'; reason: string } | { kind: 'ai_error'; reason: string }> {
    const res = await this.ai.call({
      taskType:     AISHA_TASK_TYPE,
      prompt:       transcript.join('\n'),
      systemPrompt,
      userId:       userId ?? 0,
    });
    if (!isErr(res)) {
      return { kind: 'ok', text: res.data.text ?? '' };
    }
    const reason = res.error.message;
    // The router returns "<PROVIDER>_API_KEY konfiguratsiyasi yo`q" per provider
    // and "Barcha AI provayderlar ishlamaydi" when every provider was unusable.
    if (/API_KEY|provayderlar ishlamaydi/i.test(reason)) {
      this.logger.warn('Aisha tool-loop: AI kalit yo`q — loop ishga tushmadi (struktura tayyor)');
      return { kind: 'needs_ai_key', reason };
    }
    this.logger.warn({ msg: 'Aisha tool-loop: AI xato', reason });
    return { kind: 'ai_error', reason };
  }

  /** Execute one tool. Unknown tool → structured failure observation (no fake data). */
  private async runTool(call: ToolCallRequest): Promise<ToolObservation> {
    const tool = this.tools.get(call.name);
    if (!tool) {
      return { toolName: call.name, ok: false, result: `Noma'lum tool: ${call.name}` };
    }
    const res = await tool.execute(call.args).catch((err: unknown) => {
      this.logger.error({ msg: 'Aisha tool execute threw', tool: call.name, err });
      return null;
    });
    if (res === null) {
      return { toolName: call.name, ok: false, result: 'Tool ichki xatosi' };
    }
    if (isErr(res)) {
      return { toolName: call.name, ok: false, result: res.error.message };
    }
    return { toolName: call.name, ok: true, result: res.data };
  }

  /** Build the system prompt: base instructions + the registered tool catalogue. */
  private buildSystemPrompt(extra?: string): string {
    const catalogue = [...this.tools.values()].map((t) => {
      const props = Object.entries(t.definition.inputSchema.properties)
        .map(([k, v]) => `${k}:${v.type}`)
        .join(', ');
      return `- ${t.definition.name}(${props}) — ${t.definition.description}`;
    });
    const toolsBlock = catalogue.length
      ? `Mavjud tool'lar:\n${catalogue.join('\n')}`
      : 'Hozircha tool ro\'yxatdan o\'tmagan.';
    return [
      'Sen Aisha — EuroPrint ERP yordamchisisan.',
      'Savolga javob berish uchun kerak bo\'lsa tool chaqir.',
      'Har bir javobing FAQAT JSON bo\'lsin, ikki shakldan biri:',
      'Tool chaqirish: {"tool":"<nom>","args":{...}}',
      'Yakuniy javob:  {"final":"<matn>"}',
      'Ma\'lumotni o\'ylab topma — faqat tool natijasiga tayan.',
      toolsBlock,
      extra ?? '',
    ].filter(Boolean).join('\n');
  }

  /** Parse the assistant turn JSON envelope. Non-JSON text is treated as a final answer. */
  private parseTurn(text: string): AssistantTurn {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { final: text.trim() };
    try {
      const obj = JSON.parse(match[0]) as AssistantTurn;
      return obj && typeof obj === 'object' ? obj : { final: text.trim() };
    } catch {
      return { final: text.trim() };
    }
  }

  /** Record the run on the shared decision log (audit + idempotency). Best-effort. */
  private async logDecision(
    query:    string,
    answer:   string,
    steps:    AishaLoopStep[],
    finished: boolean,
    userId?:  number,
  ): Promise<void> {
    const toolsUsed = steps.map((s) => s.toolCall?.name).filter((n): n is string => Boolean(n));
    await this.logSvc.log({
      agentCode:    AGENT_CODES.AISHA,
      entityType:   'aisha_query',
      entityId:     String(userId ?? 0),
      inputData:    { query, toolCount: toolsUsed.length },
      decision:     { action: finished ? 'answer' : 'incomplete', confidence: finished ? 1 : 0, alternatives: toolsUsed },
      confidence:   finished ? 1 : 0,
      modelVersion: AI_GEMINI_MODEL,
      autoExecuted: false,
      latencyMs:    0,
    }).catch((err: unknown) => {
      this.logger.warn({ msg: 'Aisha decision log skipped', err });
    });
    void answer;
  }

  /** Assemble the final result envelope. */
  private finish(
    status:  AishaLoopResult['status'],
    answer:  string,
    steps:   AishaLoopStep[],
    reason:  string | null,
  ): AishaLoopResult {
    const toolsUsed = steps.map((s) => s.toolCall?.name).filter((n): n is string => Boolean(n));
    return {
      status,
      answer,
      steps,
      toolsUsed: [...new Set(toolsUsed)],
      iterations: steps.length,
      reason,
    };
  }
}
