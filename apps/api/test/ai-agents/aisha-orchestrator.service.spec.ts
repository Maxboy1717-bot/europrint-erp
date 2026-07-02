/**
 * aisha-orchestrator.service.spec.ts — A78 tool-call loop (AishaOrchestratorService).
 *
 * Behavioral coverage of run(): the ask-model → run-tool → repeat loop, and the
 * Q-40 "never fabricate" gates (missing AI key vs. other provider error vs. an
 * unregistered tool). The AiRouterService and AiDecisionLogService are mocked
 * (no live DB/network); the orchestrator's own control-flow, JSON-turn parsing,
 * tool dispatch, and result-envelope assembly are the real units under test.
 */
import { AishaOrchestratorService } from '../../src/modules/ai-agents/aisha/aisha-orchestrator.service';
import { Ok, Err, AppErr } from '../../src/common/result';
import { AGENT_CODES, AI_GEMINI_MODEL } from '../../src/modules/ai-agents/common/ai-agents.constants';
import type { AishaTool } from '../../src/modules/ai-agents/aisha/aisha-tool.types';

function makeSvc() {
  const call = jest.fn();
  const log = jest.fn(async () => 'decision-hash');
  const ai = { call };
  const logSvc = { log };
  const svc = new AishaOrchestratorService(ai as never, logSvc as never);
  return { svc, call, log };
}

function echoTool(execute: AishaTool['execute']): AishaTool {
  return {
    definition: {
      name: 'echo',
      description: 'Echoes back its input',
      inputSchema: { type: 'object', properties: { x: { type: 'number' } } },
    },
    execute,
  };
}

describe('AishaOrchestratorService — tool registry', () => {
  it('registerTool adds a tool and registeredToolNames() reflects it', () => {
    const { svc } = makeSvc();
    svc.registerTool(echoTool(async () => Ok({})));
    expect(svc.registeredToolNames()).toEqual(['echo']);
  });

  it('registering the same tool name twice overwrites (idempotent by name), not duplicated', () => {
    const { svc } = makeSvc();
    svc.registerTool(echoTool(async () => Ok('first')));
    svc.registerTool(echoTool(async () => Ok('second')));
    expect(svc.registeredToolNames()).toEqual(['echo']);
  });
});

describe('AishaOrchestratorService.run — AI-key gate (Q-40: no fabrication)', () => {
  it('needs_ai_key: router Err mentioning API_KEY short-circuits with zero tool calls', async () => {
    const { svc, call, log } = makeSvc();
    call.mockResolvedValueOnce(Err('GEMINI_API_KEY konfiguratsiyasi yo`q'));

    const result = await svc.run('Ombordagi qoldiqni ko\'rsat');

    expect(result.status).toBe('needs_ai_key');
    expect(result.answer).toBe('');
    expect(result.steps).toEqual([]);
    expect(result.toolsUsed).toEqual([]);
    expect(result.iterations).toBe(0);
    expect(result.reason).toBe('GEMINI_API_KEY konfiguratsiyasi yo`q');
    expect(call).toHaveBeenCalledTimes(1);
    // gated before any decision log write
    expect(log).not.toHaveBeenCalled();
  });

  it('needs_ai_key: also triggers on the all-providers-down message', async () => {
    const { svc, call } = makeSvc();
    call.mockResolvedValueOnce(Err('Barcha AI provayderlar ishlamaydi'));

    const result = await svc.run('savol');

    expect(result.status).toBe('needs_ai_key');
    expect(result.reason).toBe('Barcha AI provayderlar ishlamaydi');
  });

  it('ai_error: a non-key provider failure (budget/5xx) is labelled ai_error, not needs_ai_key', async () => {
    const { svc, call, log } = makeSvc();
    call.mockResolvedValueOnce(Err('Kunlik AI byudjet chegarasiga yetdi'));

    const result = await svc.run('savol');

    expect(result.status).toBe('ai_error');
    expect(result.reason).toBe('Kunlik AI byudjet chegarasiga yetdi');
    expect(result.steps).toEqual([]);
    expect(log).not.toHaveBeenCalled();
  });
});

describe('AishaOrchestratorService.run — completion without tools', () => {
  it('completed: a JSON {"final":...} turn ends the loop and logs the decision', async () => {
    const { svc, call, log } = makeSvc();
    call.mockResolvedValueOnce(Ok({ text: '{"final":"Ombordagi qoldiq: 120 dona"}' }));

    const result = await svc.run('Ombordagi qoldiqni ko\'rsat', { userId: 42 });

    expect(result.status).toBe('completed');
    expect(result.answer).toBe('Ombordagi qoldiq: 120 dona');
    expect(result.iterations).toBe(1);
    expect(result.toolsUsed).toEqual([]);
    expect(result.steps).toEqual([
      { iteration: 1, assistantText: '{"final":"Ombordagi qoldiq: 120 dona"}', toolCall: null, observation: null },
    ]);

    expect(log).toHaveBeenCalledTimes(1);
    const logged = log.mock.calls[0][0] as Record<string, unknown>;
    expect(logged['agentCode']).toBe(AGENT_CODES.AISHA);
    expect(logged['entityId']).toBe('42');
    expect(logged['modelVersion']).toBe(AI_GEMINI_MODEL);
    expect(logged['decision']).toEqual({ action: 'answer', confidence: 1, alternatives: [] });
  });

  it('non-JSON assistant text is treated as the final answer verbatim (parseTurn fallback)', async () => {
    const { svc, call } = makeSvc();
    call.mockResolvedValueOnce(Ok({ text: '  Bu oddiy matnli javob, JSON emas.  ' }));

    const result = await svc.run('savol');

    expect(result.status).toBe('completed');
    expect(result.answer).toBe('Bu oddiy matnli javob, JSON emas.');
  });

  it('defaults entityId to "0" and userId 0 when opts.userId is not supplied', async () => {
    const { svc, call, log } = makeSvc();
    call.mockResolvedValueOnce(Ok({ text: '{"final":"ok"}' }));

    await svc.run('savol');

    const sentRequest = call.mock.calls[0][0] as Record<string, unknown>;
    expect(sentRequest['userId']).toBe(0);
    const logged = log.mock.calls[0][0] as Record<string, unknown>;
    expect(logged['entityId']).toBe('0');
  });
});

describe('AishaOrchestratorService.run — tool dispatch (real data only, never fabricated)', () => {
  it('runs a registered tool with the model-supplied args, feeds the real result back, then finishes', async () => {
    const { svc, call } = makeSvc();
    const execute = jest.fn(async (args: Record<string, unknown>) => Ok({ qty: (args['x'] as number) * 2 }));
    svc.registerTool(echoTool(execute));

    call
      .mockResolvedValueOnce(Ok({ text: '{"tool":"echo","args":{"x":21}}' }))
      .mockResolvedValueOnce(Ok({ text: '{"final":"Natija: 42"}' }));

    const result = await svc.run('2 barobar hisobla');

    expect(execute).toHaveBeenCalledWith({ x: 21 });
    expect(result.status).toBe('completed');
    expect(result.answer).toBe('Natija: 42');
    expect(result.iterations).toBe(2);
    expect(result.toolsUsed).toEqual(['echo']);
    expect(result.steps[0]).toEqual({
      iteration: 1,
      assistantText: '{"tool":"echo","args":{"x":21}}',
      toolCall: { id: '1-echo', name: 'echo', args: { x: 21 } },
      observation: { toolName: 'echo', ok: true, result: { qty: 42 } },
    });

    // the second model turn must have seen the real tool result in its prompt
    const secondPrompt = call.mock.calls[1][0] as { prompt: string };
    expect(secondPrompt.prompt).toContain('"qty":42');
  });

  it('an unregistered tool yields a structured "unknown tool" observation, no crash, no fabricated data', async () => {
    const { svc, call } = makeSvc();
    call
      .mockResolvedValueOnce(Ok({ text: '{"tool":"ghost_tool","args":{}}' }))
      .mockResolvedValueOnce(Ok({ text: '{"final":"tugadi"}' }));

    const result = await svc.run('savol');

    expect(result.steps[0].observation).toEqual({
      toolName: 'ghost_tool',
      ok: false,
      result: "Noma'lum tool: ghost_tool",
    });
    // toolsUsed still records the (failed) attempt name — the model asked for it
    expect(result.toolsUsed).toEqual(['ghost_tool']);
    expect(result.status).toBe('completed');
  });

  it('a tool that throws is caught and reported as an internal-error observation (never propagates)', async () => {
    const { svc, call } = makeSvc();
    svc.registerTool(echoTool(async () => {
      throw new Error('boom');
    }));
    call
      .mockResolvedValueOnce(Ok({ text: '{"tool":"echo","args":{}}' }))
      .mockResolvedValueOnce(Ok({ text: '{"final":"ok"}' }));

    const result = await svc.run('savol');
    expect(result.steps[0].observation).toEqual({ toolName: 'echo', ok: false, result: 'Tool ichki xatosi' });
  });

  it('a tool that returns Err surfaces the error message, not a fabricated success', async () => {
    const { svc, call } = makeSvc();
    svc.registerTool(echoTool(async () => Err(AppErr('EXTERNAL_SERVICE', "Ombor xizmati javob bermadi"))));
    call
      .mockResolvedValueOnce(Ok({ text: '{"tool":"echo","args":{}}' }))
      .mockResolvedValueOnce(Ok({ text: '{"final":"ok"}' }));

    const result = await svc.run('savol');

    expect(result.steps[0].observation).toEqual({
      toolName: 'echo',
      ok: false,
      result: 'Ombor xizmati javob bermadi',
    });
  });
});

describe('AishaOrchestratorService.run — iteration cap', () => {
  it('max_iterations: a model that never finalises is stopped at the configured cap, and logged as incomplete', async () => {
    const { svc, call, log } = makeSvc();
    call.mockImplementation(async () => Ok({ text: '{"tool":"echo","args":{}}' }));
    svc.registerTool(echoTool(async () => Ok('noop')));

    const result = await svc.run('savol', { maxIterations: 2 });

    expect(result.status).toBe('max_iterations');
    expect(result.iterations).toBe(2);
    expect(result.answer).toBe('');
    expect(result.reason).toBe('Iteratsiya chegarasi (2) ga yetdi');
    expect(call).toHaveBeenCalledTimes(2);

    expect(log).toHaveBeenCalledTimes(1);
    const logged = log.mock.calls[0][0] as Record<string, unknown>;
    expect(logged['decision']).toEqual({ action: 'incomplete', confidence: 0, alternatives: ['echo', 'echo'] });
  });
});

describe('AishaOrchestratorService.run — system prompt assembly', () => {
  it('the system prompt advertises registered tools and the initial prompt carries the user query', async () => {
    const { svc, call } = makeSvc();
    svc.registerTool(echoTool(async () => Ok({})));
    call.mockResolvedValueOnce(Ok({ text: '{"final":"ok"}' }));

    await svc.run('Yetkazib berish sanasini top', { systemPrompt: 'Qo\'shimcha ko\'rsatma.' });

    const sent = call.mock.calls[0][0] as { prompt: string; systemPrompt: string };
    expect(sent.prompt).toBe('Foydalanuvchi savoli: Yetkazib berish sanasini top');
    expect(sent.systemPrompt).toContain('echo(x:number) — Echoes back its input');
    expect(sent.systemPrompt).toContain("Qo'shimcha ko'rsatma.");
  });

  it('with no tools registered, the catalogue says so instead of an empty list', async () => {
    const { svc, call } = makeSvc();
    call.mockResolvedValueOnce(Ok({ text: '{"final":"ok"}' }));

    await svc.run('savol');

    const sent = call.mock.calls[0][0] as { systemPrompt: string };
    expect(sent.systemPrompt).toContain("Hozircha tool ro'yxatdan o'tmagan.");
  });
});
