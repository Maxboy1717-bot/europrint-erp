/**
 * test/ai/ai-automation-daily.service.spec.ts
 *
 * Unit tests for AiAutomationDailyService.generateDailyExecutiveSummary().
 *
 * 07-07 to'lqin: the daily LLM-backed executive summary (DirectorAiService.
 * generateExecutiveSummary) used to be logged to the server console only —
 * the owner never saw it. This spec proves the cron now renders a digest
 * (headline + keyMetrics + overallHealth) and pushes it to the configured
 * owner Telegram chat, config-gated exactly like OwnerSummaryService.trySend()
 * (director module) — graceful when config is absent, never throws.
 *
 * Coverage:
 *   TC-01  Happy path, Telegram NOT configured → digest computed, logAutomationUsage
 *          called, sendMessage never attempted, result still Ok (graceful)
 *   TC-02  DirectorAiService.generateExecutiveSummary() Err → no automation-usage log,
 *          no Telegram attempt, result still Ok (Q-40: no fabrication, no throw)
 *   TC-03  Telegram configured + sendMessage succeeds → sendMessage called with the
 *          configured chatId and a digest containing headline + all keyMetrics +
 *          overallHealth
 *   TC-04  Telegram configured + sendMessage fails → graceful, result still Ok
 *   TC-05  keyMetrics missing/non-array (Qoida 2 array safety) → digest still renders
 *          with a safe fallback placeholder instead of crashing
 */

// node-telegram-bot-api (a real transitive dependency of TelegramService) drags in an
// ESM-only package (file-type) that ts-jest's CJS transform can't parse. The real
// TelegramService is never needed here — every test supplies its own fake — so it is
// replaced with a lightweight stand-in via a factory (same technique as
// test/director/owner-summary.service.spec.ts), which stops Jest from ever loading
// (and choking on) the real module or its dependency chain.
jest.mock('../../src/telegram/telegram.service', () => ({
  TelegramService: class TelegramService {},
}));

import { AiAutomationDailyService } from '../../src/modules/ai/services/ai-automation-daily.service';
import { Ok, Err, type Result, type AppError } from '@common/result';
import type { FinanceAiService } from '../../src/modules/ai/services/finance-ai.service';
import type { DirectorAiService } from '../../src/modules/ai/services/director-ai.service';
import type { AiAutomationRepository } from '../../src/modules/ai/services/ai-automation.repository';
import type { ExecutiveSummary } from '../../src/modules/ai/services/director-ai.types';
import type { TelegramService } from '../../src/telegram/telegram.service';
import type { ConfigService } from '@nestjs/config';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeSummary(overrides: Partial<ExecutiveSummary> = {}): ExecutiveSummary {
  return {
    date: '2026-07-07',
    headline: 'Kompaniya barqaror holatda',
    keyMetrics: [
      { name: 'Xodimlar', value: '120', trend: 'STABLE' },
      { name: 'Faol leadlar', value: '15', trend: 'UP' },
    ],
    alerts: [],
    recommendations: [],
    overallHealth: 'GOOD',
    ...overrides,
  };
}

function makeFinanceAi(): FinanceAiService {
  return { detectAnomalies: jest.fn() } as unknown as FinanceAiService;
}

function makeDirectorAi(summaryResult: Result<object, AppError>): DirectorAiService {
  return { generateExecutiveSummary: jest.fn().mockResolvedValue(summaryResult) } as unknown as DirectorAiService;
}

function makeAutomationRepo(): AiAutomationRepository {
  return { logAutomationUsage: jest.fn().mockResolvedValue(undefined) } as unknown as AiAutomationRepository;
}

function makeTelegram(sendResult: Result<unknown, AppError> = Ok({})): TelegramService {
  return { sendMessage: jest.fn().mockResolvedValue(sendResult) } as unknown as TelegramService;
}

function makeConfig(values: Record<string, string | undefined> = {}): ConfigService {
  return { get: jest.fn((key: string) => values[key]) } as unknown as ConfigService;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('AiAutomationDailyService.generateDailyExecutiveSummary', () => {
  it('TC-01: happy path with Telegram not configured — digest computed, usage logged, sendMessage never called, result Ok', async () => {
    const automationRepo = makeAutomationRepo();
    const telegram = makeTelegram();
    const svc = new AiAutomationDailyService(
      makeFinanceAi(),
      makeDirectorAi(Ok(makeSummary())),
      automationRepo,
      telegram,
      makeConfig({}), // no TELEGRAM_BOT_TOKEN / OWNER_TELEGRAM_CHAT_ID
    );

    const result = await svc.generateDailyExecutiveSummary();
    expect(result.ok).toBe(true);
    expect(automationRepo.logAutomationUsage).toHaveBeenCalledWith({
      module: 'gemini',
      action: 'director.kpi_explain',
      model: 'gemini-1.5-flash',
    });
    expect(telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('TC-02: DirectorAiService failure → no usage log, no Telegram attempt, result still Ok (graceful)', async () => {
    const automationRepo = makeAutomationRepo();
    const telegram = makeTelegram();
    const svc = new AiAutomationDailyService(
      makeFinanceAi(),
      makeDirectorAi(Err({ code: 'DB_ERROR', message: 'boom' })),
      automationRepo,
      telegram,
      makeConfig({ TELEGRAM_BOT_TOKEN: 'tok', OWNER_TELEGRAM_CHAT_ID: '999' }),
    );

    const result = await svc.generateDailyExecutiveSummary();
    expect(result.ok).toBe(true);
    expect(automationRepo.logAutomationUsage).not.toHaveBeenCalled();
    expect(telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('TC-03: Telegram configured + sendMessage succeeds → called with chatId and digest containing headline + keyMetrics + overallHealth', async () => {
    const telegram = makeTelegram(Ok({}));
    const summary = makeSummary();
    const svc = new AiAutomationDailyService(
      makeFinanceAi(),
      makeDirectorAi(Ok(summary)),
      makeAutomationRepo(),
      telegram,
      makeConfig({ TELEGRAM_BOT_TOKEN: 'tok', OWNER_TELEGRAM_CHAT_ID: '999' }),
    );

    const result = await svc.generateDailyExecutiveSummary();
    expect(result.ok).toBe(true);
    expect(telegram.sendMessage).toHaveBeenCalledTimes(1);
    const [chatIdArg, textArg] = (telegram.sendMessage as jest.Mock).mock.calls[0];
    expect(chatIdArg).toBe('999');
    expect(textArg).toContain(summary.headline);
    expect(textArg).toContain('Xodimlar');
    expect(textArg).toContain('120');
    expect(textArg).toContain('Faol leadlar');
    expect(textArg).toContain('15');
    expect(textArg).toContain('GOOD');
  });

  it('TC-04: Telegram configured but sendMessage fails → graceful, result still Ok, no throw', async () => {
    const telegram = makeTelegram(Err({ code: 'EXTERNAL_SERVICE', message: 'timeout' }));
    const svc = new AiAutomationDailyService(
      makeFinanceAi(),
      makeDirectorAi(Ok(makeSummary())),
      makeAutomationRepo(),
      telegram,
      makeConfig({ TELEGRAM_BOT_TOKEN: 'tok', OWNER_TELEGRAM_CHAT_ID: '999' }),
    );

    const result = await svc.generateDailyExecutiveSummary();
    expect(result.ok).toBe(true);
    expect(telegram.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('TC-05: missing/non-array keyMetrics renders safe fallback instead of crashing (Qoida 2 array safety)', async () => {
    const telegram = makeTelegram(Ok({}));
    const summary = makeSummary({ keyMetrics: undefined as unknown as ExecutiveSummary['keyMetrics'] });
    const svc = new AiAutomationDailyService(
      makeFinanceAi(),
      makeDirectorAi(Ok(summary)),
      makeAutomationRepo(),
      telegram,
      makeConfig({ TELEGRAM_BOT_TOKEN: 'tok', OWNER_TELEGRAM_CHAT_ID: '999' }),
    );

    const result = await svc.generateDailyExecutiveSummary();
    expect(result.ok).toBe(true);
    const [, textArg] = (telegram.sendMessage as jest.Mock).mock.calls[0];
    expect(textArg).toContain('Metrikalar mavjud emas');
  });
});
