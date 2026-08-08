/**
 * test/notifications/smtp-email.adapter.spec.ts
 *
 * Unit tests for SmtpEmailAdapter
 * (apps/api/src/modules/notifications/infrastructure/external/smtp-email.adapter.ts).
 *
 * Focus: the "config missing" branch (R4, docs/audit/RESIDUAL-FIX-LOOP-2026-07-04.md).
 * Before the fix, `send()` returned `Ok(undefined)` when SMTP_HOST/SMTP_USER/
 * SMTP_PASS were unset, so callers (e.g. CrmCommsService) reported
 * `sent: true` even though nothing was ever delivered — a fake-success
 * pattern banned by Q-40. The adapter must now return `Err(EXTERNAL_SERVICE)`
 * in that case so `result.ok` is false and callers correctly report
 * `sent: false`.
 */
import { ConfigService } from '@nestjs/config';
import { SmtpEmailAdapter } from '../../src/modules/notifications/infrastructure/external/smtp-email.adapter';

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('SmtpEmailAdapter', () => {
  describe('send — missing configuration', () => {
    it('returns Err(EXTERNAL_SERVICE) when SMTP_HOST/SMTP_USER/SMTP_PASS are all unset', async () => {
      const adapter = new SmtpEmailAdapter(makeConfig({}));

      const r = await adapter.send({ to: 'user@example.com', subject: 'Hi', html: '<p>hi</p>' });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('EXTERNAL_SERVICE');
    });

    it('returns Err(EXTERNAL_SERVICE) when only SMTP_HOST is set (SMTP_USER/SMTP_PASS still missing)', async () => {
      const adapter = new SmtpEmailAdapter(makeConfig({ SMTP_HOST: 'smtp.example.com' }));

      const r = await adapter.send({ to: 'user@example.com', subject: 'Hi', html: '<p>hi</p>' });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('EXTERNAL_SERVICE');
    });

    it('returns Err(EXTERNAL_SERVICE) when SMTP_PASS alone is missing', async () => {
      const adapter = new SmtpEmailAdapter(
        makeConfig({ SMTP_HOST: 'smtp.example.com', SMTP_USER: 'noreply@europrint.uz' }),
      );

      const r = await adapter.send({ to: 'user@example.com', subject: 'Hi', html: '<p>hi</p>' });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('EXTERNAL_SERVICE');
    });

    it('sendNotification (the convenience wrapper) also surfaces the failure, not a fabricated success', async () => {
      const adapter = new SmtpEmailAdapter(makeConfig({}));

      const r = await adapter.sendNotification('user@example.com', 'Title', 'Message body');

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('EXTERNAL_SERVICE');
    });
  });
});
