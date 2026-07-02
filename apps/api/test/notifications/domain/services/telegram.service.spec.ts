/**
 * test/notifications/domain/services/telegram.service.spec.ts
 *
 * Unit test for apps/api/src/modules/notifications/domain/services/telegram.service.ts.
 *
 * That file is an intentional empty stub (`export {};`) — its own header
 * documents it as `@deprecated`, noting two real implementations exist
 * elsewhere: apps/api/src/telegram/telegram.service.ts (TelegramService,
 * node-telegram-bot-api, used by cron jobs/handlers/crm listeners) and
 * apps/api/src/modules/notifications/telegram/telegram.service.ts
 * (TelegramSvc, DB-backed with full delivery tracking — see its own spec at
 * test/notifications/telegram.service.spec.ts). There is no class, no
 * constructor, and no public method here to exercise, so a behavioral test
 * is not possible.
 *
 * This is therefore a regression-guard smoke test: it asserts the module
 * stays a true no-op re-export shim — no exports at all, and in particular
 * no `TelegramService` class — so nobody accidentally resurrects a third,
 * divergent Telegram service implementation at this path (this codebase has
 * a documented history of duplicate "two-world" services/tables drifting
 * apart; see docs/duplicates-full-audit.md). If this spec ever fails, it
 * means a real implementation was added here and either belongs at one of
 * the two canonical paths instead, or this deprecated file should finally
 * be deleted per its own TODO. Mirrors the identical pattern already used
 * for the sibling empty stub at
 * apps/api/src/modules/notifications/domain/services/sms.service.ts
 * (see test/notifications/sms.service.spec.ts).
 */
import * as TelegramStubModule from '../../../../src/modules/notifications/domain/services/telegram.service';

describe('notifications/domain/services/telegram.service.ts (deprecated empty stub)', () => {
  it('imports without throwing', () => {
    expect(TelegramStubModule).toBeDefined();
  });

  it('exports nothing — remains an empty stub, not a competing TelegramService implementation', () => {
    expect(Object.keys(TelegramStubModule)).toEqual([]);
  });

  it('does not export a TelegramService class (canonical impls live under src/telegram and notifications/telegram)', () => {
    expect((TelegramStubModule as Record<string, unknown>).TelegramService).toBeUndefined();
  });
});
