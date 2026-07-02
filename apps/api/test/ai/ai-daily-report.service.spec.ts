/**
 * Behavioural spec for AiDailyReportService (Rule 22).
 *
 * The service's core business rule is Q-40 (FABRIKATSIYA TAQIQ): when the AI
 * router has no key / fails, or the AI's text has no parseable JSON number,
 * `actualValue` MUST stay `null` and `needsManualValue` MUST be `true` — a
 * fake number must never be written to `ai_ckp_chat_logs` or, via
 * `submitAndRecord`, to `ckp_fact_values` (through CkpFactService.recordFact).
 *
 * The service is constructed directly with plain mocked collaborators
 * (aiRouter / repo / ckpFact) — no NestJS DI container needed, matching the
 * precedent in test/ai/ai-automation-events.service.spec.ts. This exercises
 * the real `submit` / `submitAndRecord` / `runDailyQuestionPush` logic
 * (JSON extraction, manual-value short-circuit, static question fallback)
 * end-to-end without touching a database.
 */
import {
  AiDailyReportService,
  type DailyReportSubmitDto,
} from '../../src/modules/ai/application/services/ai-daily-report.service';
import type {
  PrimaryCardCkpMeta,
  MachinelessCkpCard,
} from '../../src/modules/ai/infrastructure/repositories/ai-daily-report.repository';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeMeta(overrides: Partial<PrimaryCardCkpMeta> = {}): PrimaryCardCkpMeta {
  return {
    cardId: 10,
    cardName: 'Operator',
    ckp: 'Quti yopish',
    tskpTarget: 100,
    measurementUnit: 'dona',
    formulaType: null,
    employeeId: 55,
    ...overrides,
  };
}

function makeRepo(meta: PrimaryCardCkpMeta | null = makeMeta()) {
  return {
    resolvePrimaryCard: jest.fn().mockResolvedValue(Ok(meta)),
    logChatTurns: jest.fn().mockResolvedValue(Ok(1)),
    findMachinelessCardsNeedingQuestion: jest.fn().mockResolvedValue(Ok([])),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeAiRouter(result: any = Err('AI-kalit sozlanmagan')) {
  return { call: jest.fn().mockResolvedValue(result) };
}

function makeCkpFact() {
  return { recordFact: jest.fn().mockResolvedValue(Ok({ id: 1, actual_value: 1 })) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aiOk(text: string, provider = 'gemini'): any {
  return Ok({ text, provider, model: 'm', inputTokens: 1, outputTokens: 1, estimatedCostUsd: 0, latencyMs: 1 });
}

describe('AiDailyReportService', () => {
  it('is defined', () => {
    expect(AiDailyReportService).toBeDefined();
  });

  describe('submit()', () => {
    it('short-circuits on manualActualValue without calling the AI router', async () => {
      const repo = makeRepo();
      const aiRouter = makeAiRouter();
      const ckpFact = makeCkpFact();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new AiDailyReportService(aiRouter as any, repo as any, ckpFact as any);

      const dto: DailyReportSubmitDto = { factDate: '2026-07-01', message: '120 ta quti yopdim', manualActualValue: 120 };
      const result = await svc.submit(1, dto);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(aiRouter.call).not.toHaveBeenCalled();
      expect(result.data.extracted.actualValue).toBe(120);
      expect(result.data.aiAvailable).toBe(false);
      expect(result.data.needsManualValue).toBe(false);
      expect(result.data.recordEndpoint).toBe('/api/org-structure/ckp/fact');
      // T8-12: only the user's turn is logged (no AI called → no assistant turn).
      expect(repo.logChatTurns).toHaveBeenCalledWith(55, 'ckp-10-2026-07-01', [
        { role: 'user', content: '120 ta quti yopdim' },
      ]);
    });

    it('extracts actualValue from an AI JSON response wrapped in surrounding prose', async () => {
      const repo = makeRepo();
      const aiText = 'Bugungi natija:\n{"actualValue": 87, "summary": "87 quti yopildi", "issues": ["2 ta brak"]}\nRahmat!';
      const aiRouter = makeAiRouter(aiOk(aiText, 'gemini'));
      const ckpFact = makeCkpFact();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new AiDailyReportService(aiRouter as any, repo as any, ckpFact as any);

      const result = await svc.submit(1, { factDate: '2026-07-01', message: 'bugun 87 ta qildim, 2 brak' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.aiAvailable).toBe(true);
      expect(result.data.aiProvider).toBe('gemini');
      expect(result.data.extracted.actualValue).toBe(87);
      expect(result.data.extracted.summary).toBe('87 quti yopildi');
      expect(result.data.extracted.issues).toEqual(['2 ta brak']);
      expect(result.data.needsManualValue).toBe(false);
      // T8-12: both the user turn and the AI's raw text are logged.
      expect(repo.logChatTurns).toHaveBeenCalledWith(55, 'ckp-10-2026-07-01', [
        { role: 'user', content: 'bugun 87 ta qildim, 2 brak' },
        { role: 'assistant', content: aiText },
      ]);
    });

    it('never fabricates a value when the AI router has no key / fails (Q-40)', async () => {
      const repo = makeRepo();
      const aiRouter = makeAiRouter(Err('Hech qaysi AI provayder kaliti sozlanmagan'));
      const ckpFact = makeCkpFact();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new AiDailyReportService(aiRouter as any, repo as any, ckpFact as any);

      const result = await svc.submit(1, { factDate: '2026-07-01', message: 'bugun 50 ta qildim' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.aiAvailable).toBe(false);
      expect(result.data.aiProvider).toBeNull();
      expect(result.data.extracted.actualValue).toBeNull();
      expect(result.data.needsManualValue).toBe(true);
      // Only the user's message is logged — no fabricated assistant turn.
      expect(repo.logChatTurns).toHaveBeenCalledWith(55, 'ckp-10-2026-07-01', [
        { role: 'user', content: 'bugun 50 ta qildim' },
      ]);
    });

    it('falls back to a null actualValue when the AI replies with unparsable text', async () => {
      const repo = makeRepo();
      const aiRouter = makeAiRouter(aiOk('Salom, tushunmadim sizni', 'openai'));
      const ckpFact = makeCkpFact();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new AiDailyReportService(aiRouter as any, repo as any, ckpFact as any);

      const result = await svc.submit(1, { factDate: '2026-07-01', message: 'nimadir yozdim' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.aiAvailable).toBe(true); // AI did respond, just no JSON
      expect(result.data.extracted.actualValue).toBeNull();
      expect(result.data.needsManualValue).toBe(true);
      expect(result.data.extracted.summary).toBe('nimadir yozdim');
    });

    it('returns NOT_FOUND when the user has no primary card', async () => {
      const repo = makeRepo(null);
      const aiRouter = makeAiRouter();
      const ckpFact = makeCkpFact();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new AiDailyReportService(aiRouter as any, repo as any, ckpFact as any);

      const result = await svc.submit(999, { factDate: '2026-07-01', message: 'test' });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('submitAndRecord()', () => {
    it('writes the CKP fact via CkpFactService.recordFact when a value is present', async () => {
      const repo = makeRepo();
      const aiRouter = makeAiRouter();
      const ckpFact = makeCkpFact();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new AiDailyReportService(aiRouter as any, repo as any, ckpFact as any);

      const result = await svc.submitAndRecord(1, { factDate: '2026-07-01', message: '99 dona', manualActualValue: 99 });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(ckpFact.recordFact).toHaveBeenCalledWith(
        expect.objectContaining({
          cardId: 10,
          employeeId: 55,
          factDate: '2026-07-01',
          actualValue: 99,
          source: 'AI_CHAT',
          recordedBy: 1,
        }),
      );
      expect(result.data.recorded).toBe(true);
      expect(result.data.fact).toEqual({ id: 1, actual_value: 1 });
    });

    it('never records a fact when no value was extracted (Q-40 extends to persistence)', async () => {
      const repo = makeRepo();
      const aiRouter = makeAiRouter(Err('no key'));
      const ckpFact = makeCkpFact();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new AiDailyReportService(aiRouter as any, repo as any, ckpFact as any);

      const result = await svc.submitAndRecord(1, { factDate: '2026-07-01', message: 'hisobot bor lekin son yo\'q' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(ckpFact.recordFact).not.toHaveBeenCalled();
      expect(result.data.recorded).toBe(false);
      expect(result.data.fact).toBeNull();
    });

    it('reports recorded=false (does not throw) when the CKP write itself fails', async () => {
      const repo = makeRepo();
      const aiRouter = makeAiRouter();
      const ckpFact = { recordFact: jest.fn().mockResolvedValue(Err(AppErr('INTERNAL', 'db down'))) };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new AiDailyReportService(aiRouter as any, repo as any, ckpFact as any);

      const result = await svc.submitAndRecord(1, { factDate: '2026-07-01', message: 'x', manualActualValue: 10 });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.recorded).toBe(false);
      expect(result.data.fact).toBeNull();
    });
  });

  describe('runDailyQuestionPush()', () => {
    it('reports zero candidates without contacting the AI router', async () => {
      const repo = makeRepo();
      const aiRouter = makeAiRouter();
      const ckpFact = makeCkpFact();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new AiDailyReportService(aiRouter as any, repo as any, ckpFact as any);

      const result = await svc.runDailyQuestionPush('2026-07-01');

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toEqual({ factDate: '2026-07-01', candidates: 0, questionsLogged: 0, aiAvailable: false });
      expect(aiRouter.call).not.toHaveBeenCalled();
    });

    it('logs an AI-generated question for a machineless card and reports aiAvailable=true', async () => {
      const card: MachinelessCkpCard = {
        cardId: 20, cardName: "Yig'ish", ckp: 'Quti yopish', tskpTarget: 50, measurementUnit: 'dona', employeeId: 66,
      };
      const repo = makeRepo();
      repo.findMachinelessCardsNeedingQuestion.mockResolvedValue(Ok([card]));
      const aiRouter = makeAiRouter(aiOk('Bugun qancha bajardingiz?'));
      const ckpFact = makeCkpFact();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new AiDailyReportService(aiRouter as any, repo as any, ckpFact as any);

      const result = await svc.runDailyQuestionPush('2026-07-01');

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.candidates).toBe(1);
      expect(result.data.questionsLogged).toBe(1);
      expect(result.data.aiAvailable).toBe(true);
      expect(repo.logChatTurns).toHaveBeenCalledWith(66, 'ckp-20-2026-07-01', [
        { role: 'assistant', content: 'Bugun qancha bajardingiz?' },
      ]);
    });

    it('falls back to a static, context-aware question (no fabricated numbers) when the AI is unavailable', async () => {
      const card: MachinelessCkpCard = {
        cardId: 21, cardName: 'Bichuvchi', ckp: 'Kesish', tskpTarget: 200, measurementUnit: 'metr', employeeId: 67,
      };
      const repo = makeRepo();
      repo.findMachinelessCardsNeedingQuestion.mockResolvedValue(Ok([card]));
      const aiRouter = makeAiRouter(Err('no key'));
      const ckpFact = makeCkpFact();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new AiDailyReportService(aiRouter as any, repo as any, ckpFact as any);

      const result = await svc.runDailyQuestionPush('2026-07-01');

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.aiAvailable).toBe(false);
      expect(repo.logChatTurns).toHaveBeenCalledTimes(1);
      const [, , turns] = repo.logChatTurns.mock.calls[0];
      expect(turns).toHaveLength(1);
      expect(turns[0].role).toBe('assistant');
      // The static fallback uses the card's real ЦКП/norma context — it never
      // invents a number that wasn't already known from the card's own data.
      expect(turns[0].content).toContain('Kesish');
      expect(turns[0].content).toContain('200 metr');
    });
  });
});
