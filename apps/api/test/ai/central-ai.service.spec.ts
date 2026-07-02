/**
 * Behavioral spec for CentralAiService (Rule 22: every service needs a unit test).
 *
 * CentralAiService is the single choke point every AI call in the codebase
 * routes through. Its testable logic is pure request-shaping + validation:
 *   1. Rejects blank/whitespace-only prompts without calling the router.
 *   2. Builds the `AiRequest` sent to `AiRouterService.call`, folding
 *      `cardId` into `metadata.cardId` and tagging `metadata.source`.
 *   3. Passes through the router's Result (both ok and err branches) unchanged.
 * The router itself (provider selection, cost calc) is covered by its own spec;
 * here we only assert CentralAiService's own responsibility: validation +
 * request assembly + pass-through.
 */
import { CentralAiService } from '../../src/modules/ai/application/services/central-ai.service';
import { isErr, isOk } from '../../src/common/result';
import type { AiResponse } from '../../src/modules/ai/domain/types/ai.types';

describe('CentralAiService', () => {
  const makeRouter = (result: unknown) => ({
    call: jest.fn().mockResolvedValue(result),
  });

  const okResponse: AiResponse = {
    text: 'javob matni',
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    inputTokens: 10,
    outputTokens: 20,
    estimatedCostUsd: 0.0001,
    latencyMs: 250,
  };

  it('is defined', () => {
    expect(CentralAiService).toBeDefined();
  });

  it('happy: forwards a valid prompt to the router and returns its ok-Result unchanged', async () => {
    const router = makeRouter({ ok: true, data: okResponse });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new CentralAiService(router as any);

    const result = await svc.call({
      taskType: 'crm.lead_score',
      prompt: 'Ushbu lead qanchalik issiq?',
      userId: 5,
      cardId: 42,
      sessionId: 'sess-1',
      temperature: 0.2,
      maxTokens: 500,
    });

    expect(router.call).toHaveBeenCalledTimes(1);
    expect(router.call).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'crm.lead_score',
        prompt: 'Ushbu lead qanchalik issiq?',
        userId: 5,
        sessionId: 'sess-1',
        temperature: 0.2,
        maxTokens: 500,
        metadata: expect.objectContaining({ cardId: 42, source: 'central-ai' }),
      }),
    );
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.data).toEqual(okResponse);
    }
  });

  it('error: empty prompt is rejected before the router is ever called', async () => {
    const router = makeRouter({ ok: true, data: okResponse });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new CentralAiService(router as any);

    const result = await svc.call({ taskType: 'crm.lead_score', prompt: '' });

    expect(router.call).not.toHaveBeenCalled();
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toMatch(/bo'sh/);
    }
  });

  it('error: whitespace-only prompt is rejected before the router is ever called', async () => {
    const router = makeRouter({ ok: true, data: okResponse });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new CentralAiService(router as any);

    const result = await svc.call({ taskType: 'crm.lead_score', prompt: '   \n\t  ' });

    expect(router.call).not.toHaveBeenCalled();
    expect(isErr(result)).toBe(true);
  });

  it('edge: propagates an err-Result from the router unchanged (does not throw or mask it)', async () => {
    const routerError = { ok: false, error: { code: 'EXTERNAL_SERVICE', message: 'provider down' } };
    const router = makeRouter(routerError);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new CentralAiService(router as any);

    const result = await svc.call({ taskType: 'mes.oee_recommendation', prompt: 'OEE past sabab?' });

    expect(router.call).toHaveBeenCalledTimes(1);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('EXTERNAL_SERVICE');
      expect(result.error.message).toBe('provider down');
    }
  });

  it('edge: omitted cardId/userId still produce a valid metadata envelope', async () => {
    const router = makeRouter({ ok: true, data: okResponse });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new CentralAiService(router as any);

    await svc.call({ taskType: 'director.kpi_explain', prompt: 'KPI tushuntir' });

    expect(router.call).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: undefined,
        metadata: expect.objectContaining({ cardId: undefined, source: 'central-ai' }),
      }),
    );
  });
});
