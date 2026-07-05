/**
 * test/notifications/eskiz-sms.adapter.spec.ts
 *
 * Unit tests for EskizSmsAdapter
 * (apps/api/src/modules/notifications/infrastructure/external/eskiz-sms.adapter.ts).
 *
 * Focus: the "config missing" branch (R4, docs/audit/RESIDUAL-FIX-LOOP-2026-07-04.md).
 * Before the fix, `send()` returned `Ok(undefined)` when neither ESKIZ_TOKEN
 * nor INFOBIP_API_KEY were configured, so callers (e.g. CrmCommsService)
 * reported `sent: true` even though no SMS was ever delivered — a
 * fake-success pattern banned by Q-40. The adapter must now return
 * `Err(EXTERNAL_SERVICE)` in that case so `result.ok` is false and callers
 * correctly report `sent: false`.
 */
import { ConfigService } from '@nestjs/config';
import { EskizSmsAdapter } from '../../src/modules/notifications/infrastructure/external/eskiz-sms.adapter';

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('EskizSmsAdapter', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('send — missing configuration', () => {
    it('returns Err(EXTERNAL_SERVICE) when neither ESKIZ_TOKEN nor INFOBIP_API_KEY are set (object form)', async () => {
      const adapter = new EskizSmsAdapter(makeConfig({}));

      const r = await adapter.send({ to: '998901234567', text: 'hello' });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('EXTERNAL_SERVICE');
    });

    it('returns Err(EXTERNAL_SERVICE) when unconfigured (legacy two-arg form)', async () => {
      const adapter = new EskizSmsAdapter(makeConfig({}));

      const r = await adapter.send('998901234567', 'hello');

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('EXTERNAL_SERVICE');
    });

    it('does not hit the network when unconfigured', async () => {
      global.fetch = jest.fn();
      const adapter = new EskizSmsAdapter(makeConfig({}));

      await adapter.send({ to: '998901234567', text: 'hello' });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('send — configured (regression guard, legitimate paths still work)', () => {
    it('still sends via Eskiz and returns Ok on HTTP 2xx when ESKIZ_TOKEN is set', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
      const adapter = new EskizSmsAdapter(makeConfig({ ESKIZ_TOKEN: 'tok-123' }));

      const r = await adapter.send({ to: '998901234567', text: 'hello' });

      expect(r.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://notify.eskiz.uz/api/message/sms/send',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('falls back to Infobip and returns Ok on HTTP 2xx when only INFOBIP_API_KEY is set', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
      const adapter = new EskizSmsAdapter(
        makeConfig({ INFOBIP_API_KEY: 'key-123', INFOBIP_BASE_URL: 'https://api.infobip.com' }),
      );

      const r = await adapter.send({ to: '998901234567', text: 'hello' });

      expect(r.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.infobip.com/sms/2/text/advanced',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('still returns Ok(undefined) when the phone number is missing (validation no-op, unrelated to R4)', async () => {
      const adapter = new EskizSmsAdapter(makeConfig({ ESKIZ_TOKEN: 'tok-123' }));

      const r = await adapter.send({ to: '', text: 'hello' });

      expect(r.ok).toBe(true);
    });
  });
});
