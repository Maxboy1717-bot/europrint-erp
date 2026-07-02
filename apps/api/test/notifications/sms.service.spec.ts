/**
 * test/notifications/sms.service.spec.ts
 *
 * Unit test for apps/api/src/modules/notifications/domain/services/sms.service.ts.
 *
 * That file is an intentional empty stub (`export {};`) — its own header
 * documents it as `@deprecated`, with the canonical Eskiz.uz implementation
 * living at apps/api/src/modules/pos/application/services/sms.service.ts
 * (provided by PosModule). There is no class, no constructor, and no public
 * method here to exercise, so a behavioral test is not possible.
 *
 * This is therefore a regression-guard smoke test: it asserts the module
 * stays a true no-op re-export shim — no exports at all, and in particular
 * no `SmsService` class — so nobody accidentally resurrects a second,
 * divergent SmsService implementation at this path (this codebase has a
 * documented history of duplicate "two-world" services/tables drifting
 * apart; see docs/duplicates-full-audit.md). If this spec ever fails, it
 * means a real implementation was added here and either belongs at the
 * canonical pos/application/services path instead, or this deprecated file
 * should finally be deleted per its own TODO.
 */
import * as SmsStubModule from '../../src/modules/notifications/domain/services/sms.service';

describe('notifications/domain/services/sms.service.ts (deprecated empty stub)', () => {
  it('imports without throwing', () => {
    expect(SmsStubModule).toBeDefined();
  });

  it('exports nothing — remains an empty stub, not a competing SmsService implementation', () => {
    expect(Object.keys(SmsStubModule)).toEqual([]);
  });

  it('does not export a SmsService class (canonical impl lives under pos/application/services)', () => {
    expect((SmsStubModule as Record<string, unknown>).SmsService).toBeUndefined();
  });
});
