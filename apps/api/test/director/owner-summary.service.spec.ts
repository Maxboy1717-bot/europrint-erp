/**
 * test/director/owner-summary.service.spec.ts
 *
 * Unit tests for OwnerSummaryService.buildSummary().
 *
 * The service's only real business logic is (a) mapping a holat snapshot +
 * the 5 owner numbers into a rendered Telegram digest, (b) gracefully
 * falling back to safe defaults when the repository reports failure, and
 * (c) config-gating the Telegram push. All three are pure/deterministic
 * once the repo/telegram/config collaborators are replaced with simple
 * fakes — no DB or network needed — so this is a behavioural test, not a
 * smoke test.
 *
 * Coverage:
 *   TC-01  Happy path — holat + numbers pass through, digest text renders
 *          score/label/emoji and all 5 numbers, telegram not attempted
 *   TC-02  Unknown holat level → emoji falls back to '' (LEVEL_EMOJI miss)
 *   TC-03  computeNumbers() Err → zero-value fallback numbers used (Q-40:
 *          no fabrication) and digest still renders
 *   TC-04  getLatestHolat() Err → NORMAL/score 0 fallback holat used
 *   TC-05  salesTrend.deltaPct === null → digest shows the "not enough
 *          data" placeholder instead of a percentage
 *   TC-06  salesTrend.deltaPct positive → 📈 "+" prefixed percentage with
 *          uz-UZ formatted current/previous window amounts
 *   TC-07  salesTrend.deltaPct negative → 📉 prefixed (no "+"), no leading
 *          plus sign
 *   TC-08  topRisk === null → digest shows "aniqlanmadi"
 *   TC-09  topRisk with name + openDebt → digest includes churn % and qarz
 *          amount; topRisk with only churn (no debt) → qarz clause omitted
 *   TC-10  send=false (default) → telegram never touched, reason
 *          'not_requested'
 *   TC-11  send=true + missing Telegram config → sent=false,
 *          reason='telegram_not_configured', telegram.sendMessage NOT
 *          called
 *   TC-12  send=true + config present + telegram.sendMessage succeeds →
 *          sent=true, reason='ok', called with configured chatId + digest
 *          text
 *   TC-13  send=true + config present + telegram.sendMessage fails →
 *          sent=false, reason='telegram_send_failed'
 */

// node-telegram-bot-api (a real transitive dependency of TelegramService) drags in an
// ESM-only package (file-type) that ts-jest's CJS transform can't parse. The real
// TelegramService is never needed here — every test supplies its own fake — so it is
// replaced with a lightweight stand-in via a factory, which stops Jest from ever
// loading (and choking on) the real module or its dependency chain.
jest.mock('../../src/telegram/telegram.service', () => ({
  TelegramService: class TelegramService {},
}));

import { OwnerSummaryService } from '../../src/modules/director/application/owner-summary.service';
import { Ok, Err, type Result, type AppError } from '@common/result';
import type {
  OwnerSummaryRepository,
  OwnerSummaryNumbers,
  OwnerHolatSnapshot,
} from '../../src/modules/director/infrastructure/repositories/owner-summary.repository';
import type { TelegramService } from '../../src/telegram/telegram.service';
import type { ConfigService } from '@nestjs/config';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeNumbers(overrides: Partial<OwnerSummaryNumbers> = {}): OwnerSummaryNumbers {
  return {
    newCustomers: 3,
    lostCustomers: 1,
    smallCustomers: 5,
    salesTrend: { currentWindow: 1000000, previousWindow: 800000, deltaPct: 25, windowDays: 30 },
    topRisk: null,
    ...overrides,
  };
}

function makeHolat(overrides: Partial<OwnerHolatSnapshot> = {}): OwnerHolatSnapshot {
  return { level: 'NORMAL', score: 74.5, detectedAt: '2026-07-01T00:00:00.000Z', ...overrides };
}

function makeRepo(
  numbersResult: Result<OwnerSummaryNumbers, AppError>,
  holatResult: Result<OwnerHolatSnapshot, AppError>,
): OwnerSummaryRepository {
  return {
    computeNumbers: jest.fn().mockResolvedValue(numbersResult),
    getLatestHolat: jest.fn().mockResolvedValue(holatResult),
  } as unknown as OwnerSummaryRepository;
}

function makeTelegram(sendResult: Result<unknown, AppError> = Ok({})): TelegramService {
  return {
    sendMessage: jest.fn().mockResolvedValue(sendResult),
  } as unknown as TelegramService;
}

function makeConfig(values: Record<string, string | undefined> = {}): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('OwnerSummaryService', () => {
  // -------------------------------------------------------------------------
  // TC-01 / TC-02: Happy path + emoji fallback
  // -------------------------------------------------------------------------

  it('TC-01: builds summary with holat + numbers passed through and digest rendered', async () => {
    const numbers = makeNumbers();
    const holat = makeHolat({ level: 'NORMAL', score: 74.5 });
    const svc = new OwnerSummaryService(makeRepo(Ok(numbers), Ok(holat)), makeTelegram(), makeConfig());

    const result = await svc.buildSummary(false);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.holat).toEqual({ level: 'NORMAL', score: 74.5, label: 'NORMAL', emoji: '✅' });
    expect(result.data.numbers).toEqual(numbers);
    expect(result.data.telegram).toEqual({ sent: false, reason: 'not_requested' });

    const text = result.data.digestText;
    expect(text).toContain('✅');
    expect(text).toContain('NORMAL');
    expect(text).toContain('74.5');
    expect(text).toContain('3'); // newCustomers
    expect(text).toContain('1'); // lostCustomers
    expect(text).toContain('5'); // smallCustomers
  });

  it('TC-02: unrecognized holat level maps to empty emoji', async () => {
    const holat = makeHolat({ level: 'UNKNOWN_LEVEL' });
    const svc = new OwnerSummaryService(makeRepo(Ok(makeNumbers()), Ok(holat)), makeTelegram(), makeConfig());

    const result = await svc.buildSummary(false);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.holat.emoji).toBe('');
    expect(result.data.holat.level).toBe('UNKNOWN_LEVEL');
  });

  // -------------------------------------------------------------------------
  // TC-03 / TC-04: Graceful fallback on repository failure (Q-40 no fabrication)
  // -------------------------------------------------------------------------

  it('TC-03: computeNumbers() failure falls back to zero-value numbers, no fabrication', async () => {
    const holat = makeHolat();
    const svc = new OwnerSummaryService(
      makeRepo(Err({ code: 'DB_ERROR', message: 'boom' }), Ok(holat)),
      makeTelegram(),
      makeConfig(),
    );

    const result = await svc.buildSummary(false);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.numbers).toEqual({
      newCustomers: 0,
      lostCustomers: 0,
      smallCustomers: 0,
      salesTrend: { currentWindow: 0, previousWindow: 0, deltaPct: null, windowDays: 30 },
      topRisk: null,
    });
  });

  it('TC-04: getLatestHolat() failure falls back to NORMAL/score 0', async () => {
    const svc = new OwnerSummaryService(
      makeRepo(Ok(makeNumbers()), Err({ code: 'DB_ERROR', message: 'boom' })),
      makeTelegram(),
      makeConfig(),
    );

    const result = await svc.buildSummary(false);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.holat).toEqual({ level: 'NORMAL', score: 0, label: 'NORMAL', emoji: '✅' });
  });

  // -------------------------------------------------------------------------
  // TC-05 to TC-07: Sales trend rendering
  // -------------------------------------------------------------------------

  it('TC-05: null deltaPct renders the "not enough data" placeholder', async () => {
    const numbers = makeNumbers({
      salesTrend: { currentWindow: 0, previousWindow: 0, deltaPct: null, windowDays: 30 },
    });
    const svc = new OwnerSummaryService(makeRepo(Ok(numbers), Ok(makeHolat())), makeTelegram(), makeConfig());

    const result = await svc.buildSummary(false);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.digestText).toContain('taqqoslash uchun maʼlumot yetarli emas');
  });

  it('TC-06: positive deltaPct renders 📈 with "+" prefix and uz-UZ formatted amounts', async () => {
    const numbers = makeNumbers({
      salesTrend: { currentWindow: 1500000, previousWindow: 1000000, deltaPct: 50, windowDays: 30 },
    });
    const svc = new OwnerSummaryService(makeRepo(Ok(numbers), Ok(makeHolat())), makeTelegram(), makeConfig());

    const result = await svc.buildSummary(false);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.digestText).toContain('📈 +50%');
    expect(result.data.digestText).toContain((1500000).toLocaleString('uz-UZ'));
    expect(result.data.digestText).toContain((1000000).toLocaleString('uz-UZ'));
  });

  it('TC-07: negative deltaPct renders 📉 without a "+" sign', async () => {
    const numbers = makeNumbers({
      salesTrend: { currentWindow: 500000, previousWindow: 1000000, deltaPct: -50, windowDays: 30 },
    });
    const svc = new OwnerSummaryService(makeRepo(Ok(numbers), Ok(makeHolat())), makeTelegram(), makeConfig());

    const result = await svc.buildSummary(false);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.digestText).toContain('📉 -50%');
    expect(result.data.digestText).not.toContain('📉 +');
  });

  // -------------------------------------------------------------------------
  // TC-08 / TC-09: Top-risk customer rendering
  // -------------------------------------------------------------------------

  it('TC-08: null topRisk renders "aniqlanmadi"', async () => {
    const numbers = makeNumbers({ topRisk: null });
    const svc = new OwnerSummaryService(makeRepo(Ok(numbers), Ok(makeHolat())), makeTelegram(), makeConfig());

    const result = await svc.buildSummary(false);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.digestText).toContain('aniqlanmadi');
  });

  it('TC-09: topRisk with name + openDebt renders churn% and qarz amount; omits qarz when absent', async () => {
    const withDebt = makeNumbers({
      topRisk: { customerId: 42, customerName: 'ACME LLC', churnRiskPct: 80, openDebt: 250000 },
    });
    const svcWithDebt = new OwnerSummaryService(
      makeRepo(Ok(withDebt), Ok(makeHolat())),
      makeTelegram(),
      makeConfig(),
    );
    const r1 = await svcWithDebt.buildSummary(false);
    expect(r1.ok).toBe(true);
    if (r1.ok) {
      expect(r1.data.digestText).toContain('ACME LLC — churn 80%');
      expect(r1.data.digestText).toContain(`qarz ${(250000).toLocaleString('uz-UZ')} so'm`);
    }

    const withoutDebt = makeNumbers({
      topRisk: { customerId: 7, customerName: null, churnRiskPct: 60, openDebt: null },
    });
    const svcWithoutDebt = new OwnerSummaryService(
      makeRepo(Ok(withoutDebt), Ok(makeHolat())),
      makeTelegram(),
      makeConfig(),
    );
    const r2 = await svcWithoutDebt.buildSummary(false);
    expect(r2.ok).toBe(true);
    if (r2.ok) {
      expect(r2.data.digestText).toContain('#7 — churn 60%');
      expect(r2.data.digestText).not.toContain('qarz');
    }
  });

  // -------------------------------------------------------------------------
  // TC-10 to TC-13: Telegram send gating
  // -------------------------------------------------------------------------

  it('TC-10: send=false never touches Telegram, reason=not_requested', async () => {
    const telegram = makeTelegram();
    const svc = new OwnerSummaryService(makeRepo(Ok(makeNumbers()), Ok(makeHolat())), telegram, makeConfig());

    const result = await svc.buildSummary(false);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.telegram).toEqual({ sent: false, reason: 'not_requested' });
    expect(telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('TC-11: send=true with missing Telegram config never calls sendMessage', async () => {
    const telegram = makeTelegram();
    const svc = new OwnerSummaryService(
      makeRepo(Ok(makeNumbers()), Ok(makeHolat())),
      telegram,
      makeConfig({}), // no TELEGRAM_BOT_TOKEN / OWNER_TELEGRAM_CHAT_ID
    );

    const result = await svc.buildSummary(true);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.telegram).toEqual({ sent: false, reason: 'telegram_not_configured' });
    expect(telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('TC-12: send=true with config present + successful send → sent=true, reason=ok', async () => {
    const telegram = makeTelegram(Ok({}));
    const svc = new OwnerSummaryService(
      makeRepo(Ok(makeNumbers()), Ok(makeHolat())),
      telegram,
      makeConfig({ TELEGRAM_BOT_TOKEN: 'tok', OWNER_TELEGRAM_CHAT_ID: '999' }),
    );

    const result = await svc.buildSummary(true);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.telegram).toEqual({ sent: true, reason: 'ok' });
    expect(telegram.sendMessage).toHaveBeenCalledWith('999', result.data.digestText);
  });

  it('TC-13: send=true with config present but sendMessage fails → sent=false, reason=telegram_send_failed', async () => {
    const telegram = makeTelegram(Err({ code: 'EXTERNAL_SERVICE', message: 'timeout' }));
    const svc = new OwnerSummaryService(
      makeRepo(Ok(makeNumbers()), Ok(makeHolat())),
      telegram,
      makeConfig({ TELEGRAM_BOT_TOKEN: 'tok', OWNER_TELEGRAM_CHAT_ID: '999' }),
    );

    const result = await svc.buildSummary(true);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.telegram).toEqual({ sent: false, reason: 'telegram_send_failed' });
  });
});
