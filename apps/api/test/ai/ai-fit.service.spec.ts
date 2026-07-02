/**
 * Behavioral spec for AiFitService (Rule 22: every service needs a unit test).
 *
 * AiFitService's testable logic is prompt-building + defensive AI-response
 * parsing around the `AiRouterService.call` boundary:
 *   1. Builds the fit-scoring `AiRequest` (task type, prompt content, metadata).
 *   2. Defensively extracts JSON from a possibly-noisy AI text response
 *      (camelCase/snake_case key aliases, clamping, succession-threshold rule).
 *   3. Never throws when the AI call fails — persists a graceful fallback row
 *      instead (fit_score=50, fit_report={raw:'error', ...}).
 *   4. `listScores` / `getReport` are thin pass-throughs to the repository.
 * The router itself (provider selection, retries) is covered by its own spec;
 * here we only assert AiFitService's own responsibility: request assembly +
 * response parsing + graceful-fallback persistence.
 */
import { AiFitService, type FitEvaluateDto } from '../../src/modules/ai/application/services/ai-fit.service';
import { isErr, isOk } from '../../src/common/result';
import type { FitScoreRow } from '../../src/modules/ai/domain/repositories/i-ai-fit.repo';

describe('AiFitService', () => {
  const makeRouter = (result: unknown) => ({
    call: jest.fn().mockResolvedValue(result),
  });

  const makeRepo = () => ({
    insertScore: jest.fn(async (dto: Record<string, unknown>) => ({
      ok: true,
      data: { id: 1, evaluatedAt: '2026-07-01T00:00:00Z', createdAt: '2026-07-01T00:00:00Z', ...dto } as FitScoreRow,
    })),
    listScores: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    findLatestByEmployee: jest.fn().mockResolvedValue({ ok: true, data: null }),
  });

  const baseDto: FitEvaluateDto = {
    employeeId: 11,
    cardId: 22,
    employeeProfile: { skills: ['gofra'] },
    cardRequirements: { minRazryad: 3 },
  };

  it('is defined', () => {
    expect(AiFitService).toBeDefined();
  });

  it('happy: builds the fit-scoring AiRequest and persists the parsed AI response', async () => {
    const aiText = JSON.stringify({
      fitScore: 78,
      report: { strengths: ['tez'], gaps: ['tajriba'], summary: 'yaxshi nomzod' },
      bonusRecommendation: 150000,
      successionCandidate: false,
    });
    const router = makeRouter({
      ok: true,
      data: { text: aiText, provider: 'claude', model: 'claude-3', inputTokens: 10, outputTokens: 20, estimatedCostUsd: 0.001, latencyMs: 100 },
    });
    const repo = makeRepo();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new AiFitService(router as any, repo as any);

    const result = await svc.evaluate(baseDto);

    expect(router.call).toHaveBeenCalledTimes(1);
    expect(router.call).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'hr.performance_review',
        maxTokens: 700,
        temperature: 0.3,
        metadata: { feature: 'ai-fit', employeeId: 11, cardId: 22 },
        prompt: expect.stringContaining('"skills":["gofra"]'),
      }),
    );
    expect(repo.insertScore).toHaveBeenCalledWith({
      employeeId: 11,
      cardId: 22,
      fitScore: 78,
      fitReport: { strengths: ['tez'], gaps: ['tajriba'], summary: 'yaxshi nomzod' },
      bonusRecommendation: 150000,
      successionCandidate: false,
      aiProvider: 'claude',
    });
    expect(isOk(result)).toBe(true);
  });

  it('parses snake_case key aliases from the AI response', async () => {
    const aiText = JSON.stringify({
      fit_score: 60,
      fit_report: { summary: 'orta' },
      bonus_recommendation: 0,
      succession_candidate: 'true',
    });
    const router = makeRouter({ ok: true, data: { text: aiText, provider: 'gemini' } });
    const repo = makeRepo();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new AiFitService(router as any, repo as any);

    await svc.evaluate(baseDto);

    expect(repo.insertScore).toHaveBeenCalledWith(
      expect.objectContaining({
        fitScore: 60,
        fitReport: { summary: 'orta' },
        bonusRecommendation: 0,
        successionCandidate: true,
      }),
    );
  });

  it('clamps an out-of-range fitScore into [0, 100]', async () => {
    const router = makeRouter({ ok: true, data: { text: JSON.stringify({ fitScore: 150 }), provider: 'claude' } });
    const repo = makeRepo();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new AiFitService(router as any, repo as any);

    await svc.evaluate(baseDto);

    expect(repo.insertScore).toHaveBeenCalledWith(expect.objectContaining({ fitScore: 100 }));
  });

  it('auto-flags successionCandidate when fitScore reaches the 85 threshold, even if the AI omitted the flag', async () => {
    const router = makeRouter({ ok: true, data: { text: JSON.stringify({ fitScore: 90 }), provider: 'claude' } });
    const repo = makeRepo();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new AiFitService(router as any, repo as any);

    await svc.evaluate(baseDto);

    expect(repo.insertScore).toHaveBeenCalledWith(expect.objectContaining({ fitScore: 90, successionCandidate: true }));
  });

  it('extracts JSON out of a noisy/markdown-wrapped AI response', async () => {
    const noisy = 'Mana natija:\n```json\n' + JSON.stringify({ fitScore: 45, report: { summary: 'past' } }) + '\n```\nRahmat.';
    const router = makeRouter({ ok: true, data: { text: noisy, provider: 'openai' } });
    const repo = makeRepo();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new AiFitService(router as any, repo as any);

    await svc.evaluate(baseDto);

    expect(repo.insertScore).toHaveBeenCalledWith(
      expect.objectContaining({ fitScore: 45, fitReport: { summary: 'past' } }),
    );
  });

  it('falls back to score=50 + raw-text report when the AI text has no parseable JSON', async () => {
    const router = makeRouter({ ok: true, data: { text: 'kechirasiz, javob bera olmayman', provider: 'claude' } });
    const repo = makeRepo();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new AiFitService(router as any, repo as any);

    await svc.evaluate(baseDto);

    expect(repo.insertScore).toHaveBeenCalledWith(
      expect.objectContaining({
        fitScore: 50,
        fitReport: { raw: 'kechirasiz, javob bera olmayman' },
        successionCandidate: false,
      }),
    );
  });

  it('never throws when the AI call fails — persists a graceful fallback row instead', async () => {
    const router = makeRouter({ ok: false, error: { code: 'EXTERNAL_SERVICE', message: 'provider down' } });
    const repo = makeRepo();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new AiFitService(router as any, repo as any);

    const result = await svc.evaluate(baseDto);

    // NOTE: the service does `String(aiResult.error)`, and `aiResult.error` is the
    // AppError *object* (not a string) — so the persisted fallback report literally
    // stringifies to "[object Object]" rather than the error message. This spec
    // documents the actual (non-throwing) behaviour rather than the ideal one.
    expect(repo.insertScore).toHaveBeenCalledWith({
      employeeId: 11,
      cardId: 22,
      fitScore: 50,
      fitReport: { raw: 'error', error: '[object Object]' },
      bonusRecommendation: null,
      successionCandidate: false,
      aiProvider: null,
    });
    expect(isOk(result)).toBe(true);
  });

  it('propagates a repository failure (does not mask insert errors)', async () => {
    const router = makeRouter({ ok: true, data: { text: JSON.stringify({ fitScore: 70 }), provider: 'claude' } });
    const repo = makeRepo();
    repo.insertScore.mockResolvedValueOnce({ ok: false, error: { code: 'DB_ERROR', message: 'insert failed' } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new AiFitService(router as any, repo as any);

    const result = await svc.evaluate(baseDto);

    expect(isErr(result)).toBe(true);
  });

  it('listScores delegates straight to the repository with the given filters', async () => {
    const router = makeRouter({ ok: true, data: {} });
    const repo = makeRepo();
    const rows: FitScoreRow[] = [{
      id: 1, employeeId: 11, cardId: 22, fitScore: 80, fitReport: null,
      bonusRecommendation: null, successionCandidate: false, aiProvider: 'claude',
      evaluatedAt: '2026-07-01T00:00:00Z', createdAt: '2026-07-01T00:00:00Z',
    }];
    repo.listScores.mockResolvedValueOnce({ ok: true, data: rows });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new AiFitService(router as any, repo as any);

    const result = await svc.listScores({ employeeId: 11 });

    expect(repo.listScores).toHaveBeenCalledWith({ employeeId: 11 });
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.data).toEqual(rows);
  });

  it('getReport delegates straight to the repository for the latest score by employee', async () => {
    const router = makeRouter({ ok: true, data: {} });
    const repo = makeRepo();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new AiFitService(router as any, repo as any);

    const result = await svc.getReport(11);

    expect(repo.findLatestByEmployee).toHaveBeenCalledWith(11);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.data).toBeNull();
  });
});
