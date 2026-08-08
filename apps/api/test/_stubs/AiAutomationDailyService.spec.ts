/**
 * @module AiAutomationDailyService.spec
 * @description Minimal contract test for AiAutomationDailyService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module (test/ai/ai-automation-daily.service.spec.ts).
 */

// 07-07 to'lqin: AiAutomationDailyService now imports TelegramService (owner Telegram
// digest push). node-telegram-bot-api (a real transitive dependency of TelegramService)
// drags in an ESM-only package (file-type) that ts-jest's CJS transform can't parse.
// This contract test only needs the module to be importable, not a working Telegram
// client, so TelegramService is replaced with a lightweight stand-in (same technique
// as test/director/owner-summary.service.spec.ts and test/ai/ai-automation-daily.service.spec.ts).
jest.mock('../../src/telegram/telegram.service', () => ({
  TelegramService: class TelegramService {},
}));

describe('AiAutomationDailyService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/ai/services/ai-automation-daily.service');
    expect(mod).toBeDefined();
    expect(mod.AiAutomationDailyService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/ai/services/ai-automation-daily.service');
    const b = await import('../../src/modules/ai/services/ai-automation-daily.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/ai/services/ai-automation-daily.service');
    const exported = mod.AiAutomationDailyService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
